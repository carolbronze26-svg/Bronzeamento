import { useState, useEffect } from "react";

export default function PromoPopup() {
  const [open, setOpen] = useState(true);

  
  if (!open) return null;

  return (
    <div className="promoOverlay" onClick={() => setOpen(false)}>
      <div className="promoBox" onClick={(e) => e.stopPropagation()}>
        <button className="promoCloseBtn" onClick={() => setOpen(false)}>✕</button>
        <img
          src="/promo-amiga-chama-amiga.png"
          alt="Promoção Amiga chama Amiga - 2 bronzeamentos por R$150"
          className="promoImg"
        />
      </div>
    </div>
  );
}
