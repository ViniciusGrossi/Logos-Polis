import {test} from "node:test";
import assert from "node:assert/strict";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {StatePreview} from "../features/atlas/components/state-preview";

test("municipal preview identifies its level and offers state analysis rather than pretending it is a state",()=>{
  const html=renderToStaticMarkup(createElement(StatePreview,{id:"41238",name:"Belo Horizonte",level:"municipality",metric:null,loading:false,error:null,onClose:()=>{},onDeepen:()=>{},onDossier:()=>{}}));
  assert.match(html,/Município selecionado/);
  assert.match(html,/Fechar resumo do município/);
  assert.match(html,/Analisar estado/);
  assert.doesNotMatch(html,/Estado selecionado/);
});
