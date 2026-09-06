package com.fxsound.mobile;

/**
 * Biquad filter for EQ (peaking), bass (low-shelf) and clarity (high-shelf).
 * Direct-form II transposed, coefficients from the RBJ Audio EQ Cookbook.
 */
public class Biquad {
    private double b0, b1, b2, a1, a2;
    private double x1, x2, y1, y2;

    public Biquad() {
        b0 = 1; b1 = 0; b2 = 0; a1 = 0; a2 = 0;
    }

    /** Peaking EQ filter. gain in dB, Q in 1..3 */
    public void setPeaking(double freq, double gainDb, double q, double sampleRate) {
        double A = Math.pow(10, gainDb / 40.0);
        double w0 = 2 * Math.PI * freq / sampleRate;
        double cosw = Math.cos(w0);
        double sinw = Math.sin(w0);
        double alpha = sinw / (2 * q);
        double a0 = 1 + alpha / A;
        b0 = (1 + alpha * A) / a0;
        b1 = (-2 * cosw) / a0;
        b2 = (1 - alpha * A) / a0;
        a1 = (-2 * cosw) / a0;
        a2 = (1 - alpha / A) / a0;
    }

    /** Low-shelf filter (bass boost). gain in dB. */
    public void setLowShelf(double freq, double gainDb, double sampleRate) {
        double A = Math.pow(10, gainDb / 40.0);
        double w0 = 2 * Math.PI * freq / sampleRate;
        double cosw = Math.cos(w0);
        double sinw = Math.sin(w0);
        double S = 1;
        double alpha = sinw / 2 * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
        double beta = 2 * Math.sqrt(A) * alpha;
        double a0 = (A + 1) + (A - 1) * cosw + beta;
        b0 = A * ((A + 1) - (A - 1) * cosw + beta) / a0;
        b1 = 2 * A * ((A - 1) - (A + 1) * cosw) / a0;
        b2 = A * ((A + 1) - (A - 1) * cosw - beta) / a0;
        a1 = -2 * ((A - 1) + (A + 1) * cosw) / a0;
        a2 = ((A + 1) + (A - 1) * cosw - beta) / a0;
    }

    /** High-shelf filter (clarity). gain in dB. */
    public void setHighShelf(double freq, double gainDb, double sampleRate) {
        double A = Math.pow(10, gainDb / 40.0);
        double w0 = 2 * Math.PI * freq / sampleRate;
        double cosw = Math.cos(w0);
        double sinw = Math.sin(w0);
        double S = 1;
        double alpha = sinw / 2 * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
        double beta = 2 * Math.sqrt(A) * alpha;
        double a0 = (A + 1) - (A - 1) * cosw + beta;
        b0 = A * ((A + 1) + (A - 1) * cosw + beta) / a0;
        b1 = -2 * A * ((A - 1) + (A + 1) * cosw) / a0;
        b2 = A * ((A + 1) + (A - 1) * cosw - beta) / a0;
        a1 = 2 * ((A - 1) - (A + 1) * cosw) / a0;
        a2 = ((A + 1) - (A - 1) * cosw - beta) / a0;
    }

    public double process(double in) {
        double out = b0 * in + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        x2 = x1; x1 = in;
        y2 = y1; y1 = out;
        return out;
    }

    public void reset() { x1 = x2 = y1 = y2 = 0; }
}
