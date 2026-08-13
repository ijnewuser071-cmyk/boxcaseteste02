import Link from "next/link";

const benefits = [
  { number: "01", title: "Treino orientado", text: "Planos flexíveis para evoluir com técnica, constância e segurança." },
  { number: "02", title: "Modalidades completas", text: "Cross training, força e jiu-jítsu para você escolher como quer treinar." },
  { number: "03", title: "Comunidade ativa", text: "Um ambiente que acolhe, motiva e acompanha cada etapa da sua evolução." },
];

export default function Home() {
  return <main className="site-shell">
    <header className="site-header">
      <Link className="brand" href="/" aria-label="BOX — início"><span>B</span><strong>BOX</strong></Link>
      <nav aria-label="Navegação principal"><a href="#modalidades">Modalidades</a><a href="#planos">Planos</a><Link href="/protected">Área do aluno</Link></nav>
      <div className="header-actions"><Link className="login-link" href="/auth/login">Entrar ↗</Link><Link className="lime-button small" href="/auth/sign-up">Criar conta</Link></div>
    </header>
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-photo" aria-hidden="true"/><div className="lime-arc" aria-hidden="true"/>
      <div className="hero-content"><p className="eyebrow">Mossoró • RN <span/></p><h1 id="hero-title">Seu corpo<br/><em>não tem<br/>limite.</em></h1><p className="intro">Treinamento funcional integrado à natureza. Técnica, força e uma comunidade que faz você ir além.</p><div className="hero-actions"><a className="lime-button" href="#planos">Conhecer planos →</a><a className="outline-button" href="#modalidades">Ver modalidades</a></div></div>
      <aside className="area-stat"><strong>+500m<sup>2</sup></strong><p>de área verde<br/>para respirar e evoluir</p></aside>
    </section>
    <section className="benefits" id="modalidades" aria-label="Diferenciais">{benefits.map(item => <article key={item.number}><small>{item.number}</small><h2>{item.title}</h2><p>{item.text}</p></article>)}</section>
    <section className="plans" id="planos"><p className="eyebrow">Comece agora <span/></p><h2>Um plano para cada<br/><em>novo limite.</em></h2><div className="plan-grid"><article><small>Essencial</small><strong>2x <span>/ semana</span></strong><p>Acompanhamento técnico e acesso à comunidade BOX.</p><Link className="outline-button" href="/auth/sign-up">Quero começar</Link></article><article className="featured"><small>Performance</small><strong>Livre <span>/ semana</span></strong><p>Treine sem limites, evolua no seu ritmo e participe de todas as modalidades.</p><Link className="lime-button" href="/auth/sign-up">Criar minha conta</Link></article></div></section>
    <footer><span>© 2026 BOX Mossoró</span><Link href="/auth/login">Área do aluno ↗</Link></footer>
  </main>;
}
