import { useId } from "react";

const INK = "#263b35";
const CREAM = "#fff9e9";

function inkForColor(color) {
  const names = {
    black: "#000000",
    navy: "#000080",
    midnightblue: "#191970",
    darkgreen: "#006400",
    forestgreen: "#228b22",
    darkslategray: "#2f4f4f",
    darkslategrey: "#2f4f4f",
    indigo: "#4b0082",
    maroon: "#800000",
    purple: "#800080",
    brown: "#a52a2a",
    teal: "#008080",
  };
  const source = String(color).trim().toLowerCase();
  const resolved = names[source] || source;
  let rgb;
  if (/^#[\da-f]{3,4}$/i.test(resolved)) {
    rgb = resolved
      .slice(1, 4)
      .split("")
      .map((value) => parseInt(value + value, 16));
  } else if (/^#[\da-f]{6}([\da-f]{2})?$/i.test(resolved)) {
    rgb = [1, 3, 5].map((offset) =>
      parseInt(resolved.slice(offset, offset + 2), 16),
    );
  } else if (/^rgba?\(/.test(resolved)) {
    rgb = resolved
      .match(/[\d.]+%?/g)
      ?.slice(0, 3)
      .map((value) =>
        value.endsWith("%") ? parseFloat(value) * 2.55 : parseFloat(value),
      );
  }
  if (!rgb || rgb.length !== 3) return INK;
  const luminance = rgb
    .map((value) => {
      const channel = value / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    })
    .reduce(
      (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
      0,
    );
  return luminance < 0.23 ? CREAM : INK;
}

function linesFor(value, fallback) {
  const source = (value || fallback).trim().toUpperCase();
  const words = source.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (line && `${line} ${word}`.length > 17) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function PrintText({ text, fallback, y = 129, fill = INK, size = 20 }) {
  const lines = linesFor(text, fallback);
  return (
    <text
      x="80"
      y={y}
      textAnchor="middle"
      fill={fill}
      fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
      fontWeight="900"
      fontSize={size}
      letterSpacing="-0.8"
    >
      {lines.map((line, index) => (
        <tspan
          key={`${line}-${index}`}
          x="80"
          dy={index ? size * 1.03 : 0}
          textLength={line.length > 13 ? 156 : undefined}
          lengthAdjust="spacingAndGlyphs"
        >
          {line}
        </tspan>
      ))}
    </text>
  );
}

function DesignArt({ design, text, image, id, ink }) {
  if (image) {
    return (
      <g>
        <defs>
          <clipPath id={`${id}-upload`}>
            <rect x="9" y="0" width="142" height="121" rx="3" />
          </clipPath>
        </defs>
        <image
          href={image}
          x="9"
          y="0"
          width="142"
          height="121"
          preserveAspectRatio="xMidYMid meet"
          clipPath={`url(#${id}-upload)`}
        />
        {text && <PrintText text={text} y={143} size={18} fill={ink} />}
      </g>
    );
  }

  if (design === "bloom") {
    return (
      <g>
        <path
          d="M81 63C90 89 87 109 80 126"
          fill="none"
          stroke={ink}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M83 111C64 112 50 104 48 89C66 88 77 95 83 111Z" fill={ink} />
        <path d="M87 100C101 99 112 91 113 78C98 79 90 87 87 100Z" fill={ink} />
        <g>
          {Array.from({ length: 12 }, (_, index) => (
            <ellipse
              key={index}
              cx="80"
              cy="28"
              rx="10.2"
              ry="20.5"
              fill="#ed997c"
              transform={`rotate(${index * 30} 80 57)`}
            />
          ))}
          <circle cx="80" cy="57" r="21" fill="#f8cf62" />
          <circle cx="74" cy="53" r="2" fill={INK} />
          <circle cx="87" cy="53" r="2" fill={INK} />
          <path
            d="M73 63Q80 69 88 62"
            fill="none"
            stroke={INK}
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </g>
        <PrintText
          text={text}
          fallback="GROW YOUR OWN WAY"
          y={145}
          size={21}
          fill={ink}
        />
      </g>
    );
  }

  if (design === "wave") {
    return (
      <g>
        <circle cx="114" cy="30" r="24" fill="#e6a55a" />
        <path
          d="M9 101C24 104 35 101 43 89C54 71 67 48 87 48C105 48 114 64 107 79C100 64 88 72 86 82C94 72 111 81 104 97C94 116 117 118 151 103L151 124L9 124Z"
          fill="#346f85"
        />
        <path
          d="M17 109C40 116 53 96 60 79C69 56 89 49 98 59C77 56 71 89 79 101C86 111 115 114 142 108"
          fill="none"
          stroke={CREAM}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M15 120C39 123 48 119 57 114M89 122C110 126 128 121 146 116"
          fill="none"
          stroke={CREAM}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <PrintText
          text={text}
          fallback="GO WITH THE FLOW"
          y={146}
          size={20}
          fill={ink}
        />
      </g>
    );
  }

  if (design === "smile") {
    return (
      <g>
        <path
          d="M80 1L94 11L111 8L119 23L135 27L136 44L147 57L140 72L145 89L132 100L127 116L109 117L95 131L79 124L63 131L51 118L33 115L30 98L16 86L22 70L14 54L26 41L27 24L45 21L55 7L71 11Z"
          fill="#f2c854"
        />
        <ellipse
          cx="58"
          cy="54"
          rx="5"
          ry="11"
          fill={INK}
          transform="rotate(-7 58 54)"
        />
        <ellipse
          cx="100"
          cy="54"
          rx="5"
          ry="11"
          fill={INK}
          transform="rotate(7 100 54)"
        />
        <path
          d="M47 78Q80 117 113 77"
          fill="none"
          stroke={INK}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <PrintText
          text={text}
          fallback="GOOD THINGS AHEAD"
          y={153}
          size={20}
          fill={ink}
        />
      </g>
    );
  }

  if (design === "text") {
    const lines = linesFor(text, "MAKE IT YOURS");
    return (
      <g>
        <path
          d="M20 21L25 10L30 21L42 26L30 31L25 43L20 31L8 26Z"
          fill="#dc8b60"
        />
        <path
          d="M131 139L136 129L141 139L152 144L141 149L136 160L131 149L119 144Z"
          fill="#dc8b60"
        />
        <text
          x="80"
          y={74 - (lines.length - 1) * 12}
          textAnchor="middle"
          fill={ink}
          fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
          fontWeight="900"
          fontSize="32"
          letterSpacing="-1.8"
        >
          {lines.map((line, index) => (
            <tspan
              key={`${line}-${index}`}
              x="80"
              dy={index ? 34 : 0}
              textLength={line.length > 7 ? 150 : undefined}
              lengthAdjust="spacingAndGlyphs"
            >
              {line}
            </tspan>
          ))}
        </text>
        <path
          d="M28 131Q79 144 125 128"
          fill="none"
          stroke="#dc8b60"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    );
  }

  return (
    <g>
      <g stroke="#d3944d" strokeWidth="3" strokeLinecap="round">
        {Array.from({ length: 16 }, (_, index) => (
          <path
            key={index}
            d="M80 5V16"
            transform={`rotate(${index * 22.5} 80 58)`}
          />
        ))}
      </g>
      <circle cx="80" cy="58" r="34" fill="#eabc63" />
      <path
        d="M68 52Q72 46 76 52M87 52Q91 46 95 52"
        fill="none"
        stroke={INK}
        strokeWidth="2.7"
        strokeLinecap="round"
      />
      <path
        d="M70 67Q81 78 93 66"
        fill="none"
        stroke={INK}
        strokeWidth="2.7"
        strokeLinecap="round"
      />
      <PrintText
        text={text}
        fallback="SLOW DAYS CLUB"
        y={128}
        size={23}
        fill={ink}
      />
      <path d="M49 165H111" stroke="#d3944d" strokeWidth="1.5" />
    </g>
  );
}

/** Original merchandise mockups. All artwork and lighting scale with the SVG. */
export default function ProductArt({
  kind = "tee",
  color = "#f3eee3",
  design = "bloom",
  text,
  image,
  className = "",
}) {
  const id = `merch-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ink = inkForColor(color);
  const teeShape =
    "M133 60L162 46C174 65 226 65 238 46L267 60L303 77L366 155L310 197L274 154L278 390Q200 406 122 390L126 154L90 197L34 155L97 77Z";
  const hoodieShape =
    "M133 67L148 62C146 24 167 8 200 8C234 8 255 24 252 62L267 67L302 88L351 225L301 247L279 180L283 389Q200 402 117 389L121 180L99 247L49 225L98 88Z";
  const toteShape = "M96 137Q200 128 304 137L319 378Q200 405 81 378Z";
  const label = `${kind === "tee" ? "Áo thun" : kind === "hoodie" ? "Áo hoodie" : kind === "tote" ? "Túi tote" : "Cốc"} với thiết kế ${design}`;

  return (
    <svg
      className={className}
      viewBox="0 0 400 440"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
    >
      <defs>
        <filter
          id={`${id}-shadow`}
          x="-50%"
          y="-50%"
          width="200%"
          height="220%"
        >
          <feDropShadow
            dx="0"
            dy="12"
            stdDeviation="11"
            floodColor="#283c32"
            floodOpacity="0.14"
          />
        </filter>
        <linearGradient id={`${id}-fabric`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#40372c" stopOpacity="0.08" />
          <stop offset="0.16" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="0.44" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.73" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#3d3427" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={`${id}-ceramic`} x1="0" x2="1">
          <stop offset="0" stopColor="#867b70" stopOpacity="0.24" />
          <stop offset="0.16" stopColor="#fff" stopOpacity="0.54" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.81" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#83786b" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id={`${id}-collar`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#243329" stopOpacity="0.25" />
          <stop offset="1" stopColor="#243329" stopOpacity="0.07" />
        </linearGradient>
      </defs>

      {kind === "tee" && (
        <g>
          <g filter={`url(#${id}-shadow)`}>
            <path d={teeShape} fill={color} />
            <path d={teeShape} fill={`url(#${id}-fabric)`} />
          </g>
          <path
            d="M162 46C174 65 226 65 238 46C234 79 168 79 162 46Z"
            fill={`url(#${id}-collar)`}
          />
          <path
            d="M161 47C171 77 229 77 239 47"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.55"
            strokeWidth="4"
          />
          <path
            d="M157 50C168 85 233 84 243 49"
            fill="none"
            stroke="#6b6050"
            strokeOpacity="0.14"
            strokeWidth="1.5"
          />
          <path
            d="M99 79L127 154M301 79L273 154M42 157L91 191M358 157L309 191M125 382Q200 395 275 382"
            fill="none"
            stroke="#5a5143"
            strokeOpacity="0.13"
            strokeWidth="1.7"
          />
          <path
            d="M132 178C128 219 139 261 131 310M268 178C274 219 260 274 272 332"
            fill="none"
            stroke="#5a5143"
            strokeOpacity="0.055"
            strokeWidth="5"
          />
          <path
            d="M140 350Q149 363 159 362M259 306Q251 332 257 365"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.26"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <g transform="translate(131 119) scale(.86)">
            <DesignArt
              design={design}
              text={text}
              image={image}
              id={id}
              ink={ink}
            />
          </g>
        </g>
      )}

      {kind === "hoodie" && (
        <g>
          <g filter={`url(#${id}-shadow)`}>
            <path d={hoodieShape} fill={color} />
            <path d={hoodieShape} fill={`url(#${id}-fabric)`} />
          </g>
          <path
            d="M150 63C146 30 172 14 200 14C229 14 255 30 250 63L226 90L174 90Z"
            fill={`url(#${id}-collar)`}
          />
          <path
            d="M170 75C157 37 177 21 199 21C224 21 243 36 230 75L201 99Z"
            fill={color}
            opacity="0.73"
          />
          <path
            d="M153 58Q159 78 200 103Q242 78 247 58M98 90L123 180M302 90L277 180"
            fill="none"
            stroke="#443d34"
            strokeOpacity="0.16"
            strokeWidth="1.7"
          />
          <path
            d="M174 88L169 147M225 88L231 147"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.65"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M169 139V151M231 139V151"
            stroke="#5d5548"
            strokeOpacity="0.5"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M143 315L163 287H237L257 315L248 357H152Z"
            fill={`url(#${id}-fabric)`}
            stroke="#4b4338"
            strokeOpacity="0.13"
            strokeWidth="1.5"
          />
          <path
            d="M145 316L165 299M255 316L235 299M119 376Q200 389 281 376M54 215L97 234M346 215L303 234"
            fill="none"
            stroke="#4b4338"
            strokeOpacity="0.19"
            strokeWidth="2"
          />
          <g transform="translate(139 127) scale(.76)">
            <DesignArt
              design={design}
              text={text}
              image={image}
              id={id}
              ink={ink}
            />
          </g>
        </g>
      )}

      {kind === "tote" && (
        <g>
          <g filter={`url(#${id}-shadow)`}>
            <path
              d="M133 161V82C133 10 267 10 267 82V161"
              fill="none"
              stroke={color}
              strokeWidth="20"
            />
            <path
              d="M133 161V82C133 10 267 10 267 82V161"
              fill="none"
              stroke="#5a4c39"
              strokeOpacity="0.12"
              strokeWidth="12"
            />
            <path
              d="M145 153V86C145 29 255 29 255 86V153"
              fill="none"
              stroke={color}
              strokeWidth="13"
            />
            <path d={toteShape} fill={color} />
            <path d={toteShape} fill={`url(#${id}-fabric)`} />
          </g>
          <path
            d="M103 147Q200 138 297 147M94 361Q200 387 307 361M106 150L93 372M294 150L307 372"
            fill="none"
            stroke="#685b48"
            strokeOpacity="0.18"
            strokeWidth="1.5"
          />
          <path
            d="M134 144V175M266 144V175"
            stroke="#685b48"
            strokeOpacity="0.14"
            strokeWidth="2"
          />
          <path
            d="M106 293Q121 318 114 352M286 182Q278 206 287 228"
            fill="none"
            stroke="#62533e"
            strokeOpacity="0.065"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <g transform="translate(131 182) scale(.86)">
            <DesignArt
              design={design}
              text={text}
              image={image}
              id={id}
              ink={ink}
            />
          </g>
        </g>
      )}

      {kind === "mug" && (
        <g transform="translate(0 18)">
          <g filter={`url(#${id}-shadow)`}>
            <path
              d="M287 125C365 111 381 161 366 215C355 254 325 267 284 255L288 225C314 232 333 223 338 198C346 160 333 149 290 158Z"
              fill={color}
            />
            <path
              d="M289 130C355 119 372 162 356 211C347 241 322 254 288 245"
              fill="none"
              stroke="#62584c"
              strokeOpacity="0.12"
              strokeWidth="6"
            />
            <path
              d="M81 99Q190 64 299 99L289 304Q190 341 91 304Z"
              fill={color}
            />
            <path
              d="M81 99Q190 64 299 99L289 304Q190 341 91 304Z"
              fill={`url(#${id}-ceramic)`}
            />
            <ellipse cx="190" cy="99" rx="109" ry="27" fill={color} />
            <ellipse
              cx="190"
              cy="98"
              rx="100"
              ry="20"
              fill="#938777"
              opacity="0.28"
            />
            <path
              d="M95 99Q190 73 285 99Q190 122 95 99Z"
              fill="#726557"
              opacity="0.11"
            />
            <path
              d="M86 106Q191 139 295 106"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeOpacity="0.7"
            />
          </g>
          <path
            d="M99 135L106 275"
            stroke="#fff"
            strokeOpacity="0.44"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M96 297Q190 331 284 297"
            stroke="#fff"
            strokeOpacity="0.36"
            strokeWidth="2"
            fill="none"
          />
          <g transform="translate(128 139) scale(.78)">
            <DesignArt
              design={design}
              text={text}
              image={image}
              id={id}
              ink={ink}
            />
          </g>
        </g>
      )}
    </svg>
  );
}
