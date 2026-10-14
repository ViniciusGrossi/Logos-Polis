"use client";
import {useEffect,useRef,useState,useSyncExternalStore,type ReactNode} from "react";
import {ChartNoAxesCombined,PanelLeftClose,PanelLeftOpen,X} from "lucide-react";
import type {AtlasTab} from "../types";

function subscribeWidth(changed:()=>void) {
  const media=window.matchMedia("(min-width: 901px)");
  media.addEventListener("change",changed);
  return ()=>media.removeEventListener("change",changed);
}

export function AtlasWorkbench({tab,header,navigation,tools,reading,map,timeline,legend,analysis,selection,notice,presentation,modal}: {
  tab:AtlasTab;header:ReactNode;navigation:ReactNode;tools:ReactNode;reading:ReactNode;map:ReactNode;timeline:ReactNode;
  legend:ReactNode;analysis:ReactNode;selection:ReactNode;notice:ReactNode;presentation:ReactNode;modal?:ReactNode;
}) {
  const wide=useSyncExternalStore(subscribeWidth,()=>window.matchMedia("(min-width: 901px)").matches,()=>true);
  const [panelChoice,setPanel]=useState<boolean|null>(null);
  const panel=panelChoice ?? wide;
  const [expanded,setExpanded]=useState(false);
  const analysisToggle=useRef<HTMLButtonElement>(null);
  const closeButton=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if(!expanded)return;
    closeButton.current?.focus();
    const close=(event:KeyboardEvent)=>{
      if(event.key==="Escape" && !document.querySelector('.atlas-dossier[aria-modal="true"]')){
        setExpanded(false);analysisToggle.current?.focus();
      }
    };
    window.addEventListener("keydown",close);
    return ()=>window.removeEventListener("keydown",close);
  },[expanded]);
  return <div className="atlas-root atlas-immersive" data-tab={tab} data-panel={panel?"open":"closed"} data-analysis={expanded?"open":"closed"}>
    <a className="atlas-skip" href="#atlas-immersive-reading">Ir para a leitura dos dados</a>
    <div className="atlas-immersive-stage">{map}</div>
    <header className="atlas-immersive-header">{header}</header>
    <nav className="atlas-immersive-navigation" aria-label="Áreas do Atlas">{navigation}</nav>
    <div className="atlas-immersive-presentation">{presentation}</div>
    <aside className="atlas-immersive-reading" id="atlas-immersive-reading" aria-label="Leitura e ferramentas do território" hidden={!panel}>
      <div className="atlas-immersive-tools">{tools}</div>
      {notice}
      {reading}
      <button className="atlas-button atlas-button-wide" onClick={()=>setExpanded(true)}><ChartNoAxesCombined size={17}/> Abrir análises e evidências</button>
    </aside>
    <button className="atlas-immersive-panel-toggle" aria-label={panel?"Recolher leitura territorial":"Abrir leitura territorial"} aria-expanded={panel} onClick={()=>setPanel(!panel)}>{panel?<PanelLeftClose size={18}/>:<PanelLeftOpen size={18}/>}<span>{panel?"Recolher":"Leitura"}</span></button>
    <button ref={analysisToggle} className="atlas-immersive-analysis-toggle" aria-expanded={expanded} aria-controls="atlas-immersive-analysis" onClick={()=>setExpanded(!expanded)}><ChartNoAxesCombined size={18}/><span>Análises</span></button>
    <div className="atlas-immersive-selection">{selection}</div>
    <div className="atlas-immersive-legend">{legend}</div>
    <div className="atlas-immersive-dock">{timeline}</div>
    <aside className="atlas-immersive-analysis" id="atlas-immersive-analysis" aria-label="Análises e evidências" hidden={!expanded}>
      <header><div><span className="atlas-eyebrow">Investigação do recorte</span><h2>Análises e evidências</h2></div><button ref={closeButton} className="atlas-button" aria-label="Fechar análises" onClick={()=>{setExpanded(false);analysisToggle.current?.focus();}}><X size={18}/></button></header>
      <div className="atlas-immersive-analysis-body">{expanded ? analysis : null}</div>
    </aside>
    {modal}
  </div>;
}
