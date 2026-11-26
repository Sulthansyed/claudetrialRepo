import numpy as np, wave, json
SR=44100; D=25.0; N=int(SR*D); rng=np.random.default_rng(4)
def rd(p):
    w=wave.open(p); a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768; r=w.getframerate(); w.close()
    if w.getnchannels()==2: a=a[::2]
    n=int(len(a)*SR/r); return np.interp(np.linspace(0,len(a)-1,n),np.arange(len(a)),a)
t=np.arange(N)/SR
def env(a,d): return np.minimum(1,a)*d
def add(buf,s,at,g=1):
    i=int(at*SR); s=s[:max(0,N-i)]; buf[i:i+len(s)]+=s*g
def chime(f,dur=1.8):
    x=np.arange(int(SR*dur))/SR; return (np.sin(2*np.pi*f*x)+.4*np.sin(2*np.pi*2*f*x)*np.exp(-x*5))*np.exp(-x*3.2)*np.minimum(1,x*200)
def whoosh(dur=.9,up=True):
    x=np.arange(int(SR*dur))/SR; n=rng.standard_normal(len(x)); k=np.ones(40)/40; n=np.convolve(n,k,'same')-np.convolve(n,np.ones(400)/400,'same')
    e=np.sin(np.pi*np.clip(x/dur,0,1))**2; return n*e*.9
def pop(): 
    x=np.arange(int(SR*.25))/SR; return np.sin(2*np.pi*(300+700*np.exp(-x*30))*x)*np.exp(-x*18)
mus=np.zeros(N)
# soft pad: Cmaj9 -> Am9 style swells, 4 notes
chords=[[130.81,196,246.94,329.63],[110,164.81,261.63,329.63],[87.31,174.61,261.63,349.23],[130.81,196,261.63,392]]
for k in range(6):
    ch=chords[k%4]; s0=k*4.2; L=int(SR*5.4); x=np.arange(L)/SR
    pad=sum(np.sin(2*np.pi*f*x+rng.random()*6)*(.5+.5*np.sin(2*np.pi*.15*x+f)) for f in ch)/4
    e=np.sin(np.pi*np.clip(x/5.4,0,1))**1.5; add(mus,pad*e,s0,.5)
# sparkle plucks (sparser while "burning", denser at payoff)
sc=[523.25,659.25,783.99,987.77,1174.66]
for i,at in enumerate(np.arange(.4,25,.7)):
    if 8.3<=at<14.3 and i%2: continue
    f=sc[(i*3)%5]*(1 if at<21 else 2); add(mus,chime(f,1.2),at,.05+(.07 if at>21 else 0))
fx=np.zeros(N)
for ev in json.load(open('events.json'))['ev']:
    T=ev['t'];ty=ev['type']
    if ty=='whoosh': add(fx,whoosh(1.1),T-.4,.25)
    elif ty=='split': add(fx,whoosh(1.2),T-.5,.18); add(fx,chime(392,1.5),T,.2)
    elif ty=='sun': add(fx,whoosh(1.4),T-.3,.2); add(fx,chime(220,2.2),T,.18)
    elif ty=='pop': add(fx,pop(),T,.35); add(fx,chime(880,.9),T+.05,.18)
    elif ty=='rise': add(fx,whoosh(1.8),T-.2,.25)
    elif ty=='ding': add(fx,chime(1046.5,2.5),T,.3); add(fx,chime(1318.5,2.5),T+.1,.2)
    elif ty=='tick':
        for k in range(14): add(fx,pop()[:2000]*.4,.4+k*.17,.12)
vo=np.zeros(N); duck=np.ones(N)
for lid,at in zip(['l1','l2','l3','l4','l5'],[.15,3.3,8.2,14.3,20.6]):
    v=rd(f'voice/{lid}.wav'); add(vo,v,at,1.0)
    i=int(at*SR); j=min(N,i+len(v)); duck[max(0,i-2000):j+4000]=.4
duck=np.convolve(duck,np.ones(2000)/2000,'same')
out=vo*1.0+(mus+fx*1.0)*duck*.9
out*=np.minimum(1,np.minimum(t/.05,(D-t)/.8))
out=np.tanh(out*1.2)*.85
w=wave.open('mix.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype(np.int16).tobytes()); w.close()
print('ok',N/SR)
