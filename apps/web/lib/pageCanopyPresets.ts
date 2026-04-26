const canopyPresetSeeds = [
  {
    id: "fern-dawn",
    label: "Fern Dawn",
    svg:
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 720'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='#183A2A'/><stop offset='48%' stop-color='#2E7D45'/><stop offset='100%' stop-color='#F2C56B'/></linearGradient></defs><rect width='1600' height='720' fill='url(#g)'/><circle cx='1280' cy='150' r='160' fill='rgba(255,245,220,0.24)'/><circle cx='210' cy='540' r='220' fill='rgba(255,255,255,0.1)'/><path d='M0 540 C180 470 260 470 400 540 S700 640 900 540 1240 430 1600 560 V720 H0Z' fill='rgba(12,36,27,0.35)'/><path d='M0 600 C150 540 300 560 430 620 S760 700 930 610 1290 520 1600 650 V720 H0Z' fill='rgba(255,255,255,0.12)'/></svg>",
  },
  {
    id: "grove-mist",
    label: "Grove Mist",
    svg:
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 720'><defs><linearGradient id='g' x1='0%' y1='100%' x2='100%' y2='0%'><stop offset='0%' stop-color='#254336'/><stop offset='55%' stop-color='#6FA67A'/><stop offset='100%' stop-color='#E8F5EC'/></linearGradient></defs><rect width='1600' height='720' fill='url(#g)'/><path d='M0 430 C120 470 230 410 360 450 S620 590 820 520 1180 380 1600 470 V720 H0Z' fill='rgba(255,255,255,0.18)'/><path d='M0 560 C210 500 330 520 520 580 S910 670 1120 590 1370 490 1600 560 V720 H0Z' fill='rgba(20,53,39,0.28)'/><g fill='rgba(255,255,255,0.14)'><circle cx='210' cy='170' r='10'/><circle cx='260' cy='220' r='6'/><circle cx='1330' cy='180' r='12'/><circle cx='1390' cy='230' r='7'/></g></svg>",
  },
  {
    id: "sunset-ridge",
    label: "Sunset Ridge",
    svg:
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 720'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='#5C2E1F'/><stop offset='46%' stop-color='#C46A2D'/><stop offset='100%' stop-color='#F7D27A'/></linearGradient></defs><rect width='1600' height='720' fill='url(#g)'/><circle cx='1220' cy='180' r='120' fill='rgba(255,239,204,0.24)'/><path d='M0 500 C210 420 300 450 520 520 S930 610 1160 500 1420 430 1600 470 V720 H0Z' fill='rgba(69,31,20,0.34)'/><path d='M0 610 C160 560 350 580 530 630 S960 720 1160 640 1420 560 1600 610 V720 H0Z' fill='rgba(255,255,255,0.12)'/></svg>",
  },
  {
    id: "midnight-canopy",
    label: "Midnight Canopy",
    svg:
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 720'><defs><linearGradient id='g' x1='20%' y1='0%' x2='80%' y2='100%'><stop offset='0%' stop-color='#0F1B33'/><stop offset='55%' stop-color='#1D3557'/><stop offset='100%' stop-color='#355C7D'/></linearGradient></defs><rect width='1600' height='720' fill='url(#g)'/><g fill='rgba(255,255,255,0.72)'><circle cx='170' cy='120' r='2'/><circle cx='330' cy='210' r='2'/><circle cx='680' cy='140' r='3'/><circle cx='980' cy='80' r='2'/><circle cx='1350' cy='170' r='3'/><circle cx='1440' cy='260' r='2'/></g><path d='M0 520 C150 460 280 440 460 500 S780 640 960 560 1280 430 1600 530 V720 H0Z' fill='rgba(5,13,28,0.4)'/><path d='M0 610 C190 560 350 590 570 660 S1000 760 1210 670 1390 590 1600 640 V720 H0Z' fill='rgba(255,255,255,0.08)'/></svg>",
  },
];

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const pageCanopyPresets = canopyPresetSeeds.map((preset) => ({
  ...preset,
  url: svgToDataUrl(preset.svg),
}));
