package com.fxsound.mobile;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioPlaybackCaptureConfiguration;
import android.media.AudioRecord;
import android.media.AudioTrack;
import android.media.projection.MediaProjection;
import android.media.audiofx.BassBoost;
import android.media.audiofx.LoudnessEnhancer;
import android.media.audiofx.PresetReverb;
import android.media.audiofx.Virtualizer;
import android.os.Build;
import android.os.IBinder;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.ShortBuffer;

/**
 * System-wide audio engine for FxSound Mobile.
 * Captures all device audio via AudioPlaybackCapture, processes it
 * (10-band EQ + bass + clarity + balance + master gain in PCM, plus
 * reverb/surround/dynamic-boost/leveling via Android AudioEffects),
 * and plays it back to the speakers.
 */
public class AudioService extends Service {

    private static final int SAMPLE_RATE = 44100;
    private static final int CHANNELS = 2;
    private static final int BYTES_PER_SAMPLE = 2; // PCM 16-bit
    private static final double[] EQ_FREQS = {31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000};

    private MediaProjection mediaProjection;
    private AudioRecord audioRecord;
    private AudioTrack audioTrack;
    private volatile boolean running = false;
    private Thread captureThread;

    // PCM processing filters (10 bands × 2 channels + bass + clarity)
    private Biquad[][] eqFilters; // [band][channel]
    private Biquad[] bassFilters; // [channel]
    private Biquad[] clarityFilters; // [channel]

    // Android built-in effects
    private PresetReverb reverb;
    private Virtualizer virtualizer;
    private LoudnessEnhancer loudnessEnhancer;

    // Current parameters
    private volatile double[] eqGains = new double[10];
    private volatile double filterQ = 1.0;
    private volatile double bassGain = 0;     // dB
    private volatile double clarityGain = 0;  // dB
    private volatile double masterGain = 0;   // dB
    private volatile double balance = 0;      // -1..1
    private volatile double volumeLeveling = 0; // dB (additional makeup gain)
    private volatile int ambience = 0;        // 0..10
    private volatile int surround = 0;        // 0..10
    private volatile int dynamicBoost = 0;    // 0..10

    @Override
    public void onCreate() {
        super.onCreate();
        eqFilters = new Biquad[10][2];
        for (int b = 0; b < 10; b++) {
            eqFilters[b][0] = new Biquad();
            eqFilters[b][1] = new Biquad();
            eqFilters[b][0].setPeaking(EQ_FREQS[b], 0, filterQ, SAMPLE_RATE);
            eqFilters[b][1].setPeaking(EQ_FREQS[b], 0, filterQ, SAMPLE_RATE);
        }
        bassFilters = new Biquad[]{new Biquad(), new Biquad()};
        clarityFilters = new Biquad[]{new Biquad(), new Biquad()};
        updateBass();
        updateClarity();
    }

    public void setMediaProjection(MediaProjection mp) {
        this.mediaProjection = mp;
    }

    public void start() {
        if (running) return;
        startForeground(1, buildNotification());
        initAudio();
        running = true;
        captureThread = new Thread(this::captureLoop, "FxSound-Capture");
        captureThread.start();
    }

    public void stop() {
        running = false;
        if (captureThread != null) {
            captureThread.interrupt();
            try { captureThread.join(1000); } catch (InterruptedException e) { /* ignore */ }
        }
        releaseAudio();
        stopForeground(true);
    }

    private void initAudio() {
        AudioFormat format = new AudioFormat.Builder()
                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                .setSampleRate(SAMPLE_RATE)
                .setChannelMask(AudioFormat.CHANNEL_IN_STEREO)
                .build();
        int bufSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, AudioFormat.CHANNEL_IN_STEREO, AudioFormat.ENCODING_PCM_16BIT) * 2;

        AudioPlaybackCaptureConfiguration config = new AudioPlaybackCaptureConfiguration.Builder(mediaProjection)
                .addMatchingUsage(AudioAttributes.USAGE_MEDIA)
                .addMatchingUsage(AudioAttributes.USAGE_GAME)
                .addMatchingUsage(AudioAttributes.USAGE_ALARM)
                .build();

        audioRecord = new AudioRecord.Builder()
                .setAudioFormat(format)
                .setBufferSizeInBytes(bufSize)
                .setAudioPlaybackCaptureConfig(config)
                .build();
        audioRecord.startRecording();

        AudioTrack.Builder tb = new AudioTrack.Builder()
                .setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build())
                .setAudioFormat(format)
                .setBufferSizeInBytes(bufSize)
                .setTransferMode(AudioTrack.MODE_STREAM);
        audioTrack = tb.build();
        int sessionId = audioTrack.getAudioSessionId();
        audioTrack.play();

        // Built-in effects on the playback session
        try {
            reverb = new PresetReverb(1, sessionId);
            reverb.setPreset(PresetReverb.PRESET_NONE);
            reverb.setEnabled(true);
        } catch (Exception e) { reverb = null; }

        try {
            virtualizer = new Virtualizer(1, sessionId);
            virtualizer.setEnabled(true);
        } catch (Exception e) { virtualizer = null; }

        try {
            loudnessEnhancer = new LoudnessEnhancer(sessionId);
            loudnessEnhancer.setEnabled(true);
        } catch (Exception e) { loudnessEnhancer = null; }

        applyAllEffects();
    }

    private void releaseAudio() {
        if (audioRecord != null) { try { audioRecord.stop(); audioRecord.release(); } catch (Exception e) {} audioRecord = null; }
        if (audioTrack != null) { try { audioTrack.stop(); audioTrack.release(); } catch (Exception e) {} audioTrack = null; }
        if (reverb != null) { try { reverb.release(); } catch (Exception e) {} reverb = null; }
        if (virtualizer != null) { try { virtualizer.release(); } catch (Exception e) {} virtualizer = null; }
        if (loudnessEnhancer != null) { try { loudnessEnhancer.release(); } catch (Exception e) {} loudnessEnhancer = null; }
    }

    private void captureLoop() {
        int frameSize = CHANNELS * BYTES_PER_SAMPLE;
        int frames = 512;
        byte[] buffer = new byte[frames * frameSize];
        short[] samples = new short[frames * CHANNELS];
        double[] left = new double[frames];
        double[] right = new double[frames];

        while (running && audioRecord != null) {
            int bytesRead = audioRecord.read(buffer, 0, buffer.length);
            if (bytesRead <= 0) continue;
            int nFrames = bytesRead / frameSize;
            double masterLin = Math.pow(10, (masterGain + volumeLeveling) / 20.0);

            // convert bytes to doubles per channel
            ShortBuffer sb = ByteBuffer.wrap(buffer, 0, bytesRead).order(ByteOrder.LITTLE_ENDIAN).asShortBuffer();
            for (int i = 0; i < nFrames; i++) {
                left[i] = sb.get() / 32768.0;
                right[i] = sb.get() / 32768.0;
            }

            // process EQ (10 bands)
            for (int b = 0; b < 10; b++) {
                for (int i = 0; i < nFrames; i++) {
                    left[i] = eqFilters[b][0].process(left[i]);
                    right[i] = eqFilters[b][1].process(right[i]);
                }
            }
            // bass (low shelf)
            for (int i = 0; i < nFrames; i++) {
                left[i] = bassFilters[0].process(left[i]);
                right[i] = bassFilters[1].process(right[i]);
            }
            // clarity (high shelf)
            for (int i = 0; i < nFrames; i++) {
                left[i] = clarityFilters[0].process(left[i]);
                right[i] = clarityFilters[1].process(right[i]);
            }

            // balance + master gain
            double lGain = masterLin * (balance < 0 ? 1.0 : (1.0 - balance));
            double rGain = masterLin * (balance > 0 ? 1.0 : (1.0 + balance));
            for (int i = 0; i < nFrames; i++) {
                double l = left[i] * lGain;
                double r = right[i] * rGain;
                samples[i * 2] = (short) clamp(l * 32767);
                samples[i * 2 + 1] = (short) clamp(r * 32767);
            }

            audioTrack.write(samples, 0, nFrames * CHANNELS);
        }
    }

    private static double clamp(double v) {
        if (v > 32767) return 32767;
        if (v < -32768) return -32768;
        return v;
    }

    // ---- Parameter setters (called from UI via bridge) ----

    public void setEqBand(int band, double db) {
        if (band < 0 || band >= 10) return;
        eqGains[band] = db;
        eqFilters[band][0].setPeaking(EQ_FREQS[band], db, filterQ, SAMPLE_RATE);
        eqFilters[band][1].setPeaking(EQ_FREQS[band], db, filterQ, SAMPLE_RATE);
    }

    public void setFilterQ(double q) {
        filterQ = q;
        for (int b = 0; b < 10; b++) {
            eqFilters[b][0].setPeaking(EQ_FREQS[b], eqGains[b], q, SAMPLE_RATE);
            eqFilters[b][1].setPeaking(EQ_FREQS[b], eqGains[b], q, SAMPLE_RATE);
        }
    }

    public void setBass(int value) {
        bassGain = (value / 10.0) * 14;
        updateBass();
    }

    public void setClarity(int value) {
        clarityGain = (value / 10.0) * 8;
        updateClarity();
    }

    public void setMasterGain(double db) {
        masterGain = db;
    }

    public void setBalance(double v) {
        balance = v;
    }

    public void setAmbience(int value) {
        ambience = value;
        if (reverb == null) return;
        try {
            short preset;
            if (value == 0) preset = PresetReverb.PRESET_NONE;
            else if (value < 3) preset = PresetReverb.PRESET_SMALLROOM;
            else if (value < 5) preset = PresetReverb.PRESET_MEDIUMROOM;
            else if (value < 7) preset = PresetReverb.PRESET_LARGEROOM;
            else if (value < 9) preset = PresetReverb.PRESET_MEDIUMHALL;
            else preset = PresetReverb.PRESET_LARGEHALL;
            reverb.setPreset(preset);
        } catch (Exception e) { /* ignore */ }
    }

    public void setSurround(int value) {
        surround = value;
        if (virtualizer == null) return;
        try {
            virtualizer.setStrength((short) (value * 100));
        } catch (Exception e) { /* ignore */ }
    }

    public void setDynamicBoost(int value) {
        dynamicBoost = value;
        if (loudnessEnhancer == null) return;
        try {
            int targetMb = (int) ((value / 10.0) * 600); // milliBels
            loudnessEnhancer.setTargetGain(targetMb);
        } catch (Exception e) { /* ignore */ }
    }

    public void setVolumeLeveling(double db) {
        volumeLeveling = db;
    }

    private void applyAllEffects() {
        for (int b = 0; b < 10; b++) setEqBand(b, eqGains[b]);
        updateBass();
        updateClarity();
        setAmbience(ambience);
        setSurround(surround);
        setDynamicBoost(dynamicBoost);
        setVolumeLeveling(volumeLeveling);
    }

    private void updateBass() {
        bassFilters[0].setLowShelf(120, bassGain, SAMPLE_RATE);
        bassFilters[1].setLowShelf(120, bassGain, SAMPLE_RATE);
    }

    private void updateClarity() {
        clarityFilters[0].setHighShelf(6000, clarityGain, SAMPLE_RATE);
        clarityFilters[1].setHighShelf(6000, clarityGain, SAMPLE_RATE);
    }

    // ---- Foreground service plumbing ----

    private Notification buildNotification() {
        String channelId = "fxsound_audio";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(channelId, "FxSound Audio", NotificationManager.IMPORTANCE_LOW);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, channelId)
                : new Notification.Builder(this);
        b.setContentTitle("FxSound")
                .setContentText("Processing system audio")
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setOngoing(true);
        return b.build();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return new AudioBinder();
    }

    public class AudioBinder extends android.os.Binder {
        public AudioService getService() { return AudioService.this; }
    }
}
