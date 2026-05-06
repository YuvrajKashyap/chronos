import type { SkillMotif } from "@/lib/chronos-sample-data";

export function CardMotif({ type }: { type: SkillMotif }) {
  if (type === "campaign") {
    return (
      <svg className="card-motif campaign-motif" viewBox="0 0 300 250" aria-hidden="true">
        <path d="M28 210 C68 154 106 123 158 115 C202 108 235 78 276 30" />
        <path d="M48 220 C88 173 124 147 174 139 C216 132 245 107 285 72" />
        <path d="M78 230 C119 197 151 179 194 173 C235 167 261 147 295 120" />
        <path d="M82 106 L159 72 L159 171 L82 137Z" />
        <path d="M159 72 C191 85 214 102 232 123 C214 143 191 159 159 171" />
        <path d="M82 137 L62 156 L47 146 L69 120" />
        <path d="M70 118 L56 103 L74 88 L89 105" />
        <path d="M98 142 L122 204" />
        <path d="M126 130 L149 193" />
        <g className="signal-bars">
          <path d="M224 61 C242 75 254 94 259 116" />
          <path d="M245 38 C269 58 285 84 292 115" />
        </g>
        <g className="dot-cluster">
          {Array.from({ length: 30 }).map((_, index) => (
            <circle key={index} cx={190 + (index % 6) * 15} cy={156 + Math.floor(index / 6) * 13} r="1.9" />
          ))}
        </g>
      </svg>
    );
  }

  if (type === "branch") {
    return (
      <svg className="card-motif branch-motif" viewBox="0 0 240 280" aria-hidden="true">
        <path d="M79 269 C122 212 145 156 167 55" />
        <path d="M143 135 C110 120 93 91 90 57 C126 71 145 98 143 135Z" />
        <path d="M160 80 C139 57 135 30 146 6 C172 32 175 56 160 80Z" />
        <path d="M132 170 C101 169 75 150 61 119 C99 115 125 135 132 170Z" />
        <path d="M107 216 C76 224 45 211 25 184 C61 174 93 185 107 216Z" />
        <path d="M154 182 C177 162 207 153 232 159 C214 190 184 199 154 182Z" />
        <path d="M171 116 C197 98 218 91 236 95 C225 121 198 136 171 116Z" />
        <g className="dot-cluster">
          {Array.from({ length: 36 }).map((_, index) => (
            <circle key={index} cx={18 + (index % 6) * 16} cy={158 + Math.floor(index / 6) * 16} r="2.2" />
          ))}
        </g>
      </svg>
    );
  }

  if (type === "quill") {
    return (
      <svg className="card-motif quill-motif" viewBox="0 0 250 260" aria-hidden="true">
        <path d="M88 199 C108 124 151 61 203 23 C212 81 172 153 98 213" />
        <path d="M94 202 C127 156 155 107 190 47" />
        <path d="M119 163 C143 158 162 144 177 122" />
        <path d="M135 128 C156 125 174 111 190 88" />
        <path d="M106 180 C96 161 96 139 110 116" />
        <path d="M123 146 C114 126 116 106 132 84" />
        <path d="M125 220 C125 204 139 196 160 196 C181 196 195 204 195 220 L189 246 C172 252 150 252 132 246Z" />
        <path d="M134 217 C151 224 171 224 188 217" />
        <path d="M145 196 L144 184 C153 178 168 178 176 184 L175 196" />
      </svg>
    );
  }

  if (type === "mesh") {
    return (
      <svg className="card-motif mesh-motif" viewBox="0 0 300 240" aria-hidden="true">
        {Array.from({ length: 120 }).map((_, index) => {
          const col = index % 15;
          const row = Math.floor(index / 15);
          return <circle key={index} cx={62 + col * 14} cy={38 + row * 18 + col * 4} r="1.7" />;
        })}
        <path d="M31 228 C102 155 153 89 296 59" />
        <path d="M54 231 C125 165 169 111 299 82" />
        <path d="M78 234 C139 180 191 134 300 108" />
        <path d="M103 238 C162 193 210 160 300 139" />
      </svg>
    );
  }

  if (type === "clouds") {
    return (
      <svg className="card-motif clouds-motif" viewBox="0 0 300 250" aria-hidden="true">
        <path d="M97 213 C90 181 114 163 139 169 C146 137 184 126 206 149 C226 129 261 137 268 168 C292 171 305 193 296 218Z" />
        <path d="M8 239 C14 205 43 189 74 199 C84 176 112 166 136 178 C161 155 198 166 203 203 C224 203 242 218 240 239Z" />
        <path d="M124 229 C143 210 171 210 189 229" />
        <path d="M67 213 C82 197 105 197 122 213" />
        <path d="M202 174 C218 158 244 159 258 176" />
        <g className="sparkles">
          <path d="M117 42 L122 59 L139 64 L122 69 L117 86 L112 69 L95 64 L112 59Z" />
          <path d="M183 9 L186 20 L197 23 L186 26 L183 37 L180 26 L169 23 L180 20Z" />
          <path d="M65 117 L68 126 L77 129 L68 132 L65 141 L62 132 L53 129 L62 126Z" />
          <path d="M245 53 L248 62 L257 65 L248 68 L245 77 L242 68 L233 65 L242 62Z" />
        </g>
      </svg>
    );
  }

  return (
    <svg className={`card-motif ${type === "flow" ? "flow-motif" : "contour-motif"}`} viewBox="0 0 330 230" aria-hidden="true">
      <path d="M0 229 C71 172 84 130 139 128 C204 124 198 56 330 6" />
      <path d="M24 230 C91 179 105 145 153 143 C213 140 211 81 330 34" />
      <path d="M49 231 C111 187 126 160 169 157 C224 153 226 105 330 62" />
      <path d="M75 232 C132 197 148 175 185 172 C235 168 241 127 330 91" />
      <path d="M101 233 C154 207 171 190 203 187 C248 184 258 149 330 119" />
      <path d="M128 234 C176 218 195 205 222 202 C260 198 276 170 330 148" />
      {type === "contour" ? (
        <g className="dot-cluster">
          {Array.from({ length: 32 }).map((_, index) => (
            <circle key={index} cx={252 + (index % 6) * 13} cy={142 + Math.floor(index / 6) * 13} r="1.9" />
          ))}
        </g>
      ) : null}
    </svg>
  );
}
