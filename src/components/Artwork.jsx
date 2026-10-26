// Local SVG artwork keeps the demo independent of external image services.
export default function Artwork({ variant = 'studio', className = '' }) {
  if (variant !== 'studio') return <div className={`abstract-art art-${variant} ${className}`} aria-hidden="true">
    <div className="art-grid" />
    {variant === 'design' ? <><div className="design-window"><div className="mini-dots">● ● ●</div><div className="design-layout"><div /><div /><div /></div></div><div className="design-orb" /><span className="art-caption">MAKE IT<br /><b>FEEL RIGHT.</b></span></> : variant === 'ai' ? <><div className="ai-orbit orbit-one" /><div className="ai-orbit orbit-two" /><div className="ai-core">✳</div><span className="art-caption">A LITTLE<br /><b>ARTIFICIAL MAGIC.</b></span></> : <><div className="code-window"><div className="mini-dots">● ● ● <span>app.jsx</span></div><code><span>const</span> createSomething = () =&gt; {'{'}<br />&nbsp; return (<br />&nbsp;&nbsp; &lt;<em>YourNextIdea</em><br />&nbsp;&nbsp;&nbsp; curiosity={'{true}'}<br />&nbsp;&nbsp; /&gt;<br />&nbsp; );<br />{'}'}</code></div><span className="code-sticker">JUST ONE<br />MORE COMMIT.</span></>}
  </div>;
  return <svg className={`studio-art ${className}`} viewBox="0 0 1000 550" role="img" aria-label="Illustrated coding studio with a glowing monitor, plants, and a warm desk lamp">
    <defs>
      <linearGradient id="wall" x2="1" y2="1"><stop stopColor="#12202b"/><stop offset="1" stopColor="#060a14"/></linearGradient>
      <linearGradient id="desk" x2="0" y2="1"><stop stopColor="#73513a"/><stop offset="1" stopColor="#211c1c"/></linearGradient>
      <radialGradient id="warm"><stop stopColor="#ffb846" stopOpacity=".38"/><stop offset="1" stopColor="#ffb846" stopOpacity="0"/></radialGradient>
      <radialGradient id="cool"><stop stopColor="#33c2cc" stopOpacity=".2"/><stop offset="1" stopColor="#33c2cc" stopOpacity="0"/></radialGradient>
      <linearGradient id="glass" x2="0" y2="1"><stop stopColor="#163744"/><stop offset="1" stopColor="#0a1725"/></linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>
    <rect width="1000" height="550" fill="url(#wall)"/>
    <circle cx="245" cy="215" r="310" fill="url(#warm)"/><circle cx="650" cy="310" r="300" fill="url(#cool)"/>
    <path d="M0 100H1000M0 300H1000M190 0V450M815 0V450" stroke="#ffffff" strokeOpacity=".035"/>
    <rect x="627" y="32" width="262" height="254" rx="4" fill="#090e18" stroke="#303743" strokeWidth="9"/>
    <rect x="636" y="41" width="244" height="236" fill="url(#glass)"/>
    <g fill="#7b9caa" opacity=".4"><circle cx="680" cy="75" r="1.5"/><circle cx="818" cy="102" r="1.5"/><circle cx="767" cy="64" r="1"/><circle cx="855" cy="159" r="1"/></g>
    <g fill="#1d3040"><path d="M636 220h22v-45h31v28h19v-59h41v76h18v-34h26v-56h39v90h19v-26h29v83H636z"/></g>
    <g fill="#e1af5e" opacity=".35"><path d="M668 190h5v7h-5zm49-33h5v7h-5zm13 0h5v7h-5zm79-12h5v7h-5zm15 0h5v7h-5zm-94 37h5v7h-5zm79 1h5v7h-5z"/></g>
    <path d="M757 40V278M636 166H881" stroke="#303743" strokeWidth="7"/>
    <path d="M631 25h263l35 261h-39L860 36H631z" fill="#14202a"/>
    <rect x="62" y="110" width="297" height="12" rx="2" fill="#694d36"/>
    <g><rect x="100" y="63" width="14" height="46" fill="#a47045"/><rect x="116" y="53" width="15" height="56" fill="#487d80"/><rect x="133" y="59" width="13" height="50" fill="#a89b83"/><rect x="148" y="68" width="16" height="41" fill="#586079"/><path d="m169 63 15-4 12 47-15 4z" fill="#c9a559"/></g>
    <path d="M265 110V79m0 12c-47-3-39-45-18-30 14 7 18 30 18 30zm0-4c33-4 43-39 19-28-12 5-19 28-19 28z" fill="#537c58"/>
    <path d="m248 89 34 0-6 21h-22z" fill="#a27155"/>
    <rect x="54" y="191" width="109" height="138" fill="#28302e" stroke="#6d7267" strokeWidth="5"/>
    <path d="M68 279 94 235 118 258 149 211V316H68z" fill="#6b7354"/><circle cx="130" cy="218" r="12" fill="#cab377"/>
    <rect x="170" y="198" width="69" height="88" fill="#1d2227" stroke="#585144" strokeWidth="4"/>
    <text x="183" y="224" fill="#c4ae86" fontSize="10" fontFamily="monospace">LESS TALK.</text><text x="183" y="242" fill="#c4ae86" fontSize="10" fontFamily="monospace">MORE</text><text x="183" y="260" fill="#e4ba65" fontSize="12" fontFamily="monospace">BUILDING.</text>
    <path d="M0 426 1000 413v40H0z" fill="url(#desk)"/><path d="M0 453H1000" stroke="#9f714d" strokeWidth="3" opacity=".35"/>
    <path d="M116 425 132 421 224 270" fill="none" stroke="#3a3a37" strokeWidth="12"/>
    <path d="m222 273 24-106" fill="none" stroke="#686050" strokeWidth="7"/><circle cx="222" cy="273" r="10" fill="#a18b66"/>
    <path d="m243 168 52-5 34 48-114 12z" fill="#ddaf66"/><path d="m215 223 114-12" stroke="#ffe0a0" strokeWidth="6"/><ellipse cx="256" cy="364" rx="175" ry="70" fill="url(#warm)"/><path d="m221 229-86 194h280l-91-207" fill="#ffc56a" opacity=".045"/>
    <rect x="342" y="177" width="384" height="234" rx="12" fill="#080b13" stroke="#3f484c" strokeWidth="3"/>
    <rect x="352" y="187" width="364" height="207" rx="4" fill="#101d28"/>
    <rect x="352" y="187" width="364" height="18" fill="#23313b"/><g fill="#556371"><circle cx="363" cy="196" r="3"/><circle cx="373" cy="196" r="3"/><circle cx="383" cy="196" r="3"/></g>
    <rect x="352" y="205" width="67" height="189" fill="#121a24"/>
    <g stroke="#4b5964" strokeWidth="3"><path d="M367 221h34M367 232h28M375 243h29M375 254h21M375 265h32M375 276h25M367 298h29M375 309h24"/></g>
    <g fontFamily="monospace" fontSize="10"><text x="438" y="228" fill="#b897d6">import <tspan fill="#b9d7d8">{'{'} curiosity {'}'}</tspan> from <tspan fill="#d2ae73">'life';</tspan></text><text x="438" y="254" fill="#b897d6">const <tspan fill="#64c1c5">BuildSomething</tspan> = () =&gt; {'{'}</text><text x="451" y="277" fill="#b897d6">return <tspan fill="#bbced9">(</tspan></text><text x="465" y="300" fill="#64c1c5">&lt;YourNextIdea</text><text x="478" y="322" fill="#d6b16b">passion=<tspan fill="#c0d6dd">{'{true}'}</tspan></text><text x="478" y="344" fill="#d6b16b">possibilities=<tspan fill="#c0d6dd">"endless"</tspan></text><text x="465" y="365" fill="#64c1c5">/&gt;</text><text x="438" y="385" fill="#b897d6">{'}'};</text></g>
    <path d="M516 411h39v20h49v7H469v-7h47z" fill="#333a3e"/>
    <path d="m423 438 254-1 32 21H398z" fill="#18212b" stroke="#454b4d"/><g stroke="#59616a" strokeWidth="2" opacity=".6"><path d="M426 443h245m-233 5h245m-207 5h191"/></g>
    <ellipse cx="770" cy="452" rx="22" ry="10" fill="#233039"/><path d="M762 445h16" stroke="#55bac4" strokeWidth="2"/>
    <rect x="266" y="373" width="43" height="48" rx="5" fill="#bca385"/><path d="M309 382h9c15 0 15 24 0 24h-9" fill="none" stroke="#bca385" strokeWidth="7"/><path d="M279 359c-9-13 9-14 0-29m14 31c-8-10 8-14 0-25" fill="none" stroke="#bda681" opacity=".2" strokeWidth="2"/>
    <path d="M884 414V302m0 68c-65-6-86-79-54-72 43 11 54 72 54 72zm0-22c61-18 81-75 47-67-34 11-47 67-47 67zm0-23c-37-29-42-89-18-77 20 14 18 77 18 77zm0 61c48-9 58-49 37-43-21 5-37 43-37 43z" fill="#3d684d"/>
    <path d="m849 386 76 0-10 50h-54z" fill="#927052"/><path d="M849 386h76" stroke="#bd9270" strokeWidth="5"/>
    <path d="M800 550H267c4-75 46-104 117-109h235c110 7 160 36 181 109" fill="#090d17"/><path d="M399 550v-41c0-32 31-55 91-55h67c54 0 84 23 84 55v41" fill="#19212b" stroke="#313840" strokeWidth="3"/>
    <rect width="1000" height="550" fill="url(#warm)" opacity=".12"/>
  </svg>;
}
