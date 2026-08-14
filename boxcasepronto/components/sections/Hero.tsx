import Link from "next/link";

export function Hero() {
  return <section className="hero"><div className="hero-grid" aria-hidden="true"/><div className="container hero-content">
    <div><span className="hero-kicker">Mossoró • RN <i/></span><h1 className="display">Seu corpo<br/><em>não tem limite.</em></h1><p>Treinamento funcional integrado à natureza. Técnica, força e uma comunidade que faz você ir além.</p><div className="hero-actions"><Link href="#planos" className="button">Conhecer planos <span>→</span></Link><Link href="#modalidades" className="button button-outline">Ver modalidades</Link></div></div>
    <div className="hero-stat"><span>+500m²</span><p>de área verde<br/>para respirar e evoluir</p></div>
  </div><div className="container hero-benefits"><article><span>01</span><h2>Treino orientado</h2><p>Planos flexíveis para evoluir com técnica, constância e segurança.</p></article><article><span>02</span><h2>Modalidades completas</h2><p>Cross training, força e jiu-jitsu para você escolher como quer treinar.</p></article><article><span>03</span><h2>Comunidade ativa</h2><p>Um ambiente que acolhe, motiva e acompanha cada etapa da sua evolução.</p></article></div><div className="hero-marquee" aria-hidden="true"><div className="hero-marquee-track"><span>FORÇA • MOVIMENTO • TÉCNICA • COMUNIDADE • FORÇA • MOVIMENTO • TÉCNICA • COMUNIDADE •</span><span>FORÇA • MOVIMENTO • TÉCNICA • COMUNIDADE • FORÇA • MOVIMENTO • TÉCNICA • COMUNIDADE •</span></div></div></section>;
}
