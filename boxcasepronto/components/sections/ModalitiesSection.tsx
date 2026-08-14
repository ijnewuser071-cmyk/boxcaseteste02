import { modalities } from "@/lib/constants";

export function ModalitiesSection() {
  return <section className="section modalities" id="modalidades"><div className="container"><span className="eyebrow">Programas especiais</span><h2 className="display section-title">Escolha sua jornada.</h2><p className="modality-guide">Conheça cada modalidade e siga a cadeia até encontrar o treino ideal para você. <span>Deslize para explorar →</span></p><div className="modality-list" aria-label="Modalidades disponíveis">{modalities.map((item)=><article key={item.name} className="modality-card"><span className="modality-index">{item.index}</span><div><small>{item.tag}</small><h3 className="display">{item.name}</h3></div><p>{item.description}</p><ul>{item.benefits.map(b=><li key={b}>{b}</li>)}</ul><a href="#planos" aria-label={`Ver planos de ${item.name}`}><span>Ver planos</span> ↗</a></article>)}</div></div></section>;
}
