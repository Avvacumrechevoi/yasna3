# -*- coding: utf-8 -*-
"""Своя музыка для роликов «Ясных маршрутов».

Ничего заимствованного: всё синтезируется здесь из синусоид, поэтому вопрос
прав на фонограмму снимается целиком.

Замысел: спокойный эоловый лад, темп 62, без ударных. Три голоса —
колокольчик (аддитивный синтез с разным затуханием обертонов), тёплая
подложка из расстроенных пил и мягкий бас. Реверберация — свёртка
с синтезированным импульсным откликом.

Каждому ролику своя мелодическая линия: зерно генератора берётся из номера,
поэтому тринадцать роликов не звучат одинаково, но остаются одной музыкой.
"""
import numpy as np
import wave, struct, sys, os

SR = 44100

def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12.0)

def env(n, a, d, s, r, sustain=0.65):
    """Огибающая ADSR в отсчётах."""
    a, d, r = max(int(a*SR),1), max(int(d*SR),1), max(int(r*SR),1)
    s = max(n - a - d - r, 0)
    out = np.concatenate([
        np.linspace(0, 1, a),
        np.linspace(1, sustain, d),
        np.full(s, sustain),
        np.linspace(sustain, 0, r),
    ])
    return np.resize(out, n) if len(out) != n else out

def bell(f, dur, amp=1.0):
    """Колокольчик: обертоны затухают с разной скоростью — так звук «оседает»."""
    n = int(dur * SR); t = np.arange(n) / SR
    parts = [(1.0, 1.00, 2.8), (2.0, 0.42, 1.9), (3.01, 0.24, 1.3),
             (4.16, 0.13, 0.9), (5.43, 0.07, 0.6), (6.79, 0.04, 0.45)]
    y = np.zeros(n)
    for mult, a, dec in parts:
        y += a * np.sin(2*np.pi*f*mult*t) * np.exp(-t/dec)
    # мягкая атака, чтобы не щёлкало
    atk = int(0.006*SR)
    y[:atk] *= np.linspace(0, 1, atk)
    return amp * y / 1.9

def pad(f, dur, amp=1.0, voices=3):
    """Подложка: несколько расстроенных голосов, у каждого спад обертонов 1/n."""
    n = int(dur * SR); t = np.arange(n) / SR
    y = np.zeros(n)
    for v in range(voices):
        det = 1.0 + (v - (voices-1)/2) * 0.0035          # расстройка ±6 центов
        drift = 1.0 + 0.0015*np.sin(2*np.pi*(0.11+0.03*v)*t + v)
        # Спад обертонов 1/n^1.55: под видеорядом слишком яркая подложка спорит
        # с картинкой, а слишком тёмная превращается в гул. Это середина.
        for h in range(1, 9):
            y += (1.0/h**1.55) * np.sin(2*np.pi*f*det*h*drift*t + v*1.7)
    y *= env(n, 1.1, 0.6, 0, 1.4, sustain=0.62)
    return amp * y / (voices * 2.6)

def bass(f, dur, amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    y = np.sin(2*np.pi*f*t) + 0.18*np.sin(2*np.pi*f*2*t)
    y *= env(n, 0.03, 0.9, 0, 0.9, sustain=0.45)
    return amp * y / 1.2

def impulse_response(dur=2.4, predelay=0.022):
    """Импульсный отклик: затухающий шум с ранними отражениями."""
    n = int(dur*SR); t = np.arange(n)/SR
    rng = np.random.default_rng(12345)
    ir = rng.normal(0, 1, n) * np.exp(-t*2.6)
    # приглушаем верх — иначе хвост шипит
    k = 24
    ir = np.convolve(ir, np.ones(k)/k, mode='same')
    for d, g in [(0.011,0.55),(0.019,0.42),(0.031,0.33),(0.047,0.25)]:
        i = int(d*SR)
        if i < n: ir[i:] += g*ir[:n-i]
    pre = np.zeros(int(predelay*SR))
    ir = np.concatenate([pre, ir])
    return ir / np.abs(ir).max()

IR = impulse_response()

def reverb(x, mix=0.3):
    n = len(x)
    L = 1 << int(np.ceil(np.log2(n + len(IR))))
    wet = np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(IR, L))[:n]
    wet /= (np.abs(wet).max() + 1e-9)
    return (1-mix)*x + mix*wet*np.abs(x).max()

def master_eq(x):
    """Срез инфраниза и мягкий подъём верха.

    Без этого 64% энергии оказывалось ниже 120 Гц: на телефонном динамике
    такая музыка глухая, а в наушниках гудит."""
    n = len(x)
    L = 1 << int(np.ceil(np.log2(n)))
    X = np.fft.rfft(x, L)
    f = np.fft.rfftfreq(L, 1/SR)
    g = np.ones_like(f)
    g *= 1.0 / (1.0 + (42.0/np.maximum(f, 1.0))**4)      # обрез ниже 42 Гц
    g *= 1.0 / (1.0 + (np.maximum(f, 1.0)/72.0)**-1.5)   # плавный спад к низу
    g *= 1.0 + 0.9/(1.0 + (2600.0/np.maximum(f, 1.0))**2)  # полка сверху
    g *= 1.0 / (1.0 + (np.maximum(f, 1.0)/14000.0)**3)   # мягкий срез самого верха
    return np.fft.irfft(X*g, L)[:n]

def soft_clip(x):
    return np.tanh(x * 1.15) / np.tanh(1.15)

# ── музыкальный материал ────────────────────────────────────────────────
BPM = 62.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT

# ля минор натуральный. Ход намеренно без доминантового разрешения —
# он не «закрывается», поэтому не тянет на себя внимание под видеорядом.
PROG = [
    (57, [57, 60, 64, 67]),   # Am7
    (53, [53, 57, 60, 64]),   # Fmaj7
    (48, [48, 55, 60, 64]),   # Cmaj9
    (52, [52, 55, 59, 62]),   # Em7
]
PENT = [69, 72, 74, 76, 79, 81, 84]     # ля-минорная пентатоника сверху

def compose(seconds, seed=0):
    rng = np.random.default_rng(1000 + seed)
    n = int(seconds * SR) + SR
    mix = np.zeros(n)

    nbars = int(np.ceil(seconds / (BAR*2))) + 1
    for b in range(nbars):
        root, chord = PROG[b % len(PROG)]
        t0 = int(b * BAR * 2 * SR)
        if t0 >= n: break

        # подложка на два такта
        p = pad(midi(root + 12), BAR*2 + 0.6, amp=0.30)
        end = min(t0 + len(p), n); mix[t0:end] += p[:end-t0]

        # бас на первую долю каждого такта
        for k in (0, 1):
            bi = t0 + int(k * BAR * SR)
            bb = bass(midi(root - 12), BAR*0.95, amp=0.22)
            e = min(bi + len(bb), n)
            if bi < n: mix[bi:e] += bb[:e-bi]

        # арпеджио колокольчиком — восьмые через одну, рисунок плавает
        steps = [0, 1.5, 3, 4.5, 6, 7.5]
        for si, s in enumerate(steps):
            note = chord[(si + b) % len(chord)] + 12
            ai = t0 + int(s * BEAT * SR)
            if ai >= n: break
            bl = bell(midi(note), 2.6, amp=0.24 + 0.04*rng.random())
            e = min(ai + len(bl), n); mix[ai:e] += bl[:e-ai]

        # редкая мелодия сверху: одна-две ноты на два такта
        for _ in range(rng.integers(1, 3)):
            s = float(rng.choice([1.0, 2.5, 4.0, 5.5, 7.0]))
            note = int(rng.choice(PENT))
            ai = t0 + int(s * BEAT * SR)
            if ai >= n: continue
            bl = bell(midi(note), 3.2, amp=0.17)
            e = min(ai + len(bl), n); mix[ai:e] += bl[:e-ai]

    mix = mix[:int(seconds*SR)]
    mix = master_eq(mix)
    mix = reverb(mix, mix=0.30)
    mix /= (np.abs(mix).max() + 1e-9)
    mix = soft_clip(mix * 0.82)

    # плавные вход и выход
    fi = int(1.6*SR); fo = int(2.4*SR)
    if len(mix) > fi + fo:
        mix[:fi] *= np.linspace(0, 1, fi) ** 1.5
        mix[-fo:] *= np.linspace(1, 0, fo) ** 1.5

    # лёгкое расширение по стерео: правый канал с задержкой 11 мс
    d = int(0.011*SR)
    right = np.concatenate([np.zeros(d), mix[:-d]]) * 0.96 + mix * 0.12
    st = np.stack([mix, right[:len(mix)]], axis=1)
    st /= (np.abs(st).max() + 1e-9)
    return st * 0.89

def save_wav(path, st):
    data = (np.clip(st, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())

if __name__ == '__main__':
    secs = float(sys.argv[1]); seed = int(sys.argv[2]); out = sys.argv[3]
    st = compose(secs, seed)
    save_wav(out, st)
    rms = float(np.sqrt((st**2).mean()))
    print(f'{os.path.basename(out)}: {secs:.1f} c, RMS {20*np.log10(rms+1e-12):.1f} dBFS, '
          f'пик {20*np.log10(np.abs(st).max()+1e-12):.1f} dBFS, {os.path.getsize(out)//1024} КБ')
