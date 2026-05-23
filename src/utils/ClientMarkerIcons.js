import mayoristaImg from "../icons/supermercado.png";
import tiendaImg from "../icons/tienda.png";
import barImg from "../icons/bar.png";
import restauranteImg from "../icons/tenedor.png";

export const CHANNEL_CONFIG = {
    Mayorista: {
        label: "Mayorista",
        emoji: "🏭",
        image: mayoristaImg,
        color: "#7C3AED",
        colorDark: "#5B21B6",
        bgClass: "bg-violet-100",
        textClass: "text-violet-700",
        borderClass: "border-violet-300",
    },
    Tienda: {
        label: "Tienda",
        emoji: "🏪",
        image: tiendaImg,
        color: "#0EA5E9",
        colorDark: "#0369A1",
        bgClass: "bg-sky-100",
        textClass: "text-sky-700",
        borderClass: "border-sky-300",
    },
    Bar: {
        label: "Bar",
        emoji: "🍺",
        image: barImg,
        color: "#D97706",
        colorDark: "#92400E",
        bgClass: "bg-amber-100",
        textClass: "text-amber-700",
        borderClass: "border-amber-300",
    },
    Restaurante: {
        label: "Restaurante",
        emoji: "🍽️",
        image: restauranteImg,
        color: "#DC2626",
        colorDark: "#991B1B",
        bgClass: "bg-red-100",
        textClass: "text-red-700",
        borderClass: "border-red-300",
    },
    default: {
        label: "Cliente",
        emoji: "📍",
        image: null,
        color: "#64748B",
        colorDark: "#334155",
        bgClass: "bg-slate-100",
        textClass: "text-slate-700",
        borderClass: "border-slate-300",
    },
};

export const getChannelConfig = (channel) => {
    return CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.default;
};

const iconCache = new Map();

const loadImageAsBase64 = (imageUrl) => {
    return new Promise((resolve, reject) => {
        if (iconCache.has(imageUrl)) {
            resolve(iconCache.get(imageUrl));
            return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            try {
                const dataUrl = canvas.toDataURL("image/png");
                iconCache.set(imageUrl, dataUrl);
                resolve(dataUrl);
            } catch (e) {
                resolve(imageUrl);
            }
        };
        img.onerror = () => resolve(imageUrl);
        img.src = imageUrl;
    });
};

export const buildCircularMarkerSvg = async (
    channel,
    isSelected = false
) => {

    const config = getChannelConfig(channel);
const size = isSelected ? 72 : 58;
const ringWidth = 8;
const innerSize = isSelected ? 44 : 36;
const innerOffset = (size - innerSize) / 2;

    let imageSrc = null;

    if (config.image) {
        imageSrc = await loadImageAsBase64(config.image);
    }

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
      width="${size}"
      height="${size}"
      viewBox="0 0 ${size} ${size}">

      <defs>
        <filter id="shadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <clipPath id="clip">
          <circle
            cx="${size / 2}"
            cy="${size / 2}"
            r="${(size - ringWidth * 2) / 2 - 2}"
          />
        </clipPath>
      </defs>

      <circle
        cx="${size / 2}"
        cy="${size / 2}"
        r="${(size - ringWidth * 2) / 2}"
        fill="white"
        stroke="${config.color}"
strokeWidth="${ringWidth}"
filter="url(#shadow)"
      />

      ${imageSrc
            ? `
          <image
            href="${imageSrc}"
            x="${innerOffset}"
            y="${innerOffset}"
            width="${innerSize}"
            height="${innerSize}"
            preserveAspectRatio="xMidYMid meet"
            clip-path="url(#clip)"
          />
        `
            : `
          <text
            x="${size / 2}"
            y="${size / 2 + 5}"
            text-anchor="middle"
            font-size="18"
          >
            ${config.emoji}
          </text>
        `
        }

    </svg>
  `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const buildMarkerIcon = async (
    channel,
    google,
    isSelected = false
) => {

    if (!google?.maps) return null;

    const size = isSelected ? 56 : 44;

    const svgUrl = await buildCircularMarkerSvg(
        channel,
        isSelected
    );

    return {
        url: svgUrl,

        scaledSize: new google.maps.Size(
            size,
            size
        ),

        anchor: new google.maps.Point(
            size / 2,
            size / 2
        ),
    };
};

export const preloadChannelIcons = async () => {
    const promises = Object.values(CHANNEL_CONFIG)
        .filter(c => c.image)
        .map(c => loadImageAsBase64(c.image));
    await Promise.all(promises);
};

export const CHANNEL_LIST = ["Mayorista", "Tienda", "Bar", "Restaurante"];