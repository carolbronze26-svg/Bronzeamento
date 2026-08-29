import { useState, useEffect } from "react";

// Duração de cada fase da animação (ms)
const FASE_MAQUINA = 8000;    // máquina aparece + "bronzeia"
const FASE_CONDICAO = 4500;   // imagem "condição especial" fica visível
// depois disso, a imagem final da promoção fica até o usuário fechar

export default function PromoPopup() {
  const [open, setOpen] = useState(true);
  const [fase, setFase] = useState("maquina"); // "maquina" -> "condicao" -> "final"

  useEffect(() => {
    if (!open) return;
    const t1 = setTimeout(() => setFase("condicao"), FASE_MAQUINA);
    const t2 = setTimeout(() => setFase("final"), FASE_MAQUINA + FASE_CONDICAO);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="promoOverlay" onClick={() => setOpen(false)}>
      <div
        className={`promoBox promoAnimatedBox is${fase.charAt(0).toUpperCase()}${fase.slice(1)}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="promoCloseBtn" onClick={() => setOpen(false)}>✕</button>

        {/* Palco único: máquina e imagens ocupam o mesmo espaço,
            uma por cima da outra, fazendo crossfade real */}
        <div className="promoStage">
          <div className="promoMachineWrap">
            <div className="promoMachineFrame">
              <img src="/maquina-bronzeamento.png" alt="" className="promoMachineImg" />
              <div className="promoFlash" />
            </div>
          </div>

          {(fase === "condicao" || fase === "final") && (
            <img
              src="/promo-condicao-especial.png"
              alt="Pensei em uma condição especial para começar setembro"
              className={`promoStackedImg ${fase === "condicao" ? "promoImgReveal" : "promoImgFadeOut"}`}
            />
          )}

          {fase === "final" && (
            <img
              src="/promo-amiga-chama-amiga.png"
              alt="Promoção Amiga chama Amiga - 2 bronzeamentos por R$150"
              className="promoStackedImg promoImgReveal"
            />
          )}
        </div>
      </div>
    </div>
  );
}