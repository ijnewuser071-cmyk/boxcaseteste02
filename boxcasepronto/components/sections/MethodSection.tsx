const pillars = [{n:"01", title:"Técnica antes da carga", text:"Movimento bem feito vem primeiro. Construímos uma base sólida antes de qualquer progressão."},{n:"02", title:"Adaptação individual", text:"Cada exercício respeita seu nível atual para garantir uma evolução segura e constante."},{n:"03", title:"Supervisão real", text:"Coaches especialistas acompanham cada movimento e você nunca treina sem direção."}];

export function MethodSection() {
  return <section className="section method"><div className="container"><span className="eyebrow">Nossa metodologia</span><div className="method-heading"><h2 className="display section-title">Intensidade<br/>com inteligência.</h2><p>Resultado duradouro vem de um treino bem estruturado — não de destruir o corpo.</p></div><div className="pillar-grid">{pillars.map(p=><article key={p.n} className="pillar"><span>{p.n}</span><h3 className="display">{p.title}</h3><p>{p.text}</p></article>)}</div></div></section>;
}
