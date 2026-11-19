import { useRef, useState } from 'react';
import clsx from 'clsx';
import { FileAudio, Film, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { useDropFiles } from '../lib/hooks.js';
import { ASSET_CATEGORY_LABEL } from '../lib/shared.js';
import { Modal } from './overlays.jsx';
import { fileUrl } from '../lib/format.js';
import { Badge } from './ui.jsx';

export function FileDrop({ onFiles, accept, multiple = false, title = '拖拽文件到这里', hint, icon: Icon = UploadCloud, compact = false, className }) {
  const inputRef = useRef(null);
  const { over, bind } = useDropFiles((files) => onFiles(multiple ? files : files.slice(0, 1)));
  return (
    <div
      {...bind}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      className={clsx(
        'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center transition-all duration-200',
        compact ? 'px-4 py-4' : 'px-6 py-7',
        over
          ? 'border-[color-mix(in_srgb,var(--accent)_60%,transparent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]'
          : 'border-[var(--line-strong)] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:bg-white/[0.035]',
        className,
      )}
    >
      <div
        className={clsx(
          'flex items-center justify-center rounded-xl border border-[var(--line)] bg-white/[0.04] text-[var(--fg-3)] transition-colors group-hover:text-[var(--accent)]',
          compact ? 'h-8 w-8' : 'h-10 w-10',
        )}
      >
        <Icon size={compact ? 15 : 18} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[12.5px] font-medium text-[var(--fg-2)]">{title}</span>
        {hint ? <span className="text-[11px] leading-relaxed text-[var(--fg-3)]">{hint}</span> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files || [])];
          if (files.length) onFiles(multiple ? files : files.slice(0, 1));
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function ImageLightbox({ open, onOpenChange, src, title, subtitle }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} size="5xl" hideClose bodyClassName="flex flex-col items-center gap-3 bg-black/40 px-4 py-5">
      {src ? <img src={src} alt={title || ''} className="max-h-[76vh] max-w-full rounded-lg object-contain shadow-2xl" /> : null}
      {title ? (
        <div className="flex items-center gap-2 pb-1">
          <span className="text-[13px] font-medium text-[var(--fg)]">{title}</span>
          {subtitle ? <Badge>{subtitle}</Badge> : null}
        </div>
      ) : null}
    </Modal>
  );
}

// 视频右上角分辨率角标：按视频实际短边归一到最近的标准档位（与项目 VIDEO_RESOLUTIONS 一致）。
// 元数据未就绪（dim 为空）时不渲染；非常规尺寸回退显示「宽×高」。
const VIDEO_RES_LADDER = [['4K', 2160], ['2K', 1440], ['1080P', 1080], ['768P', 768], ['720P', 720], ['540P', 540], ['480P', 480], ['360P', 360]];

export function videoResolutionLabel(width, height) {
  const short = Math.min(Number(width) || 0, Number(height) || 0);
  if (!short) return '';
  const hit = VIDEO_RES_LADDER.find(([, h]) => short >= h - 12);
  return hit ? hit[0] : width + '×' + height;
}

// 图片分辨率角标：按总像素归到项目档位（1K≈1MP / 2K≈4MP / 4K≈8.3MP），
// 落在档位区间外回退显示「宽×高」。
const IMAGE_RES_TIERS = [['1K', 1, 0.8, 1.6], ['2K', 4, 3.2, 6.4], ['4K', 8.3, 6.6, 13.3]];

export function imageResolutionLabel(width, height) {
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  if (!w || !h) return '';
  const mp = (w * h) / 1e6;
  const hit = IMAGE_RES_TIERS.find(([, , lo, hi]) => mp >= lo && mp <= hi);
  return hit ? hit[0] : w + '×' + h;
}

// 右上角分辨率角标。label 为空时不渲染。
export function ResolutionBadge({ label, className = 'right-2 top-2' }) {
  if (!label) return null;
  return (
    <span className={clsx('pointer-events-none absolute rounded-md border border-white/10 bg-black/60 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white/85 backdrop-blur', className)}>
      {label}
    </span>
  );
}

// 带分辨率角标的视频播放器（角标在右上角，无分辨率信息时不显示）。
export function VideoPane({ src, className, controls = true, muted = false, playsInline = false, autoPlay = false, wrapClassName = 'relative h-full w-full' }) {
  const [dim, setDim] = useState(null);
  const label = dim ? videoResolutionLabel(dim.w, dim.h) : '';
  return (
    <div className={wrapClassName}>
      <video
        className={className}
        src={src}
        controls={controls}
        muted={muted}
        playsInline={playsInline}
        autoPlay={autoPlay}
        preload="metadata"
        onLoadedMetadata={(e) => setDim({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight })}
      />
      <ResolutionBadge label={label} />
    </div>
  );
}

// 带分辨率角标的图片（角标在右上角，无分辨率信息时不显示）。
export function ImagePane({ src, alt = '', className, onClick }) {
  const [dim, setDim] = useState(null);
  const label = dim ? imageResolutionLabel(dim.w, dim.h) : '';
  return (
    <span className="relative block h-full w-full">
      <img
        className={className}
        src={src}
        alt={alt}
        loading="lazy"
        onClick={onClick}
        onLoad={(e) => setDim({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
      />
      <ResolutionBadge label={label} />
    </span>
  );
}

// 素材缩略：视频 > 图片 > 音频 > 占位。样式交给调用方控制宽高。
export function AssetMedia({ projectId, asset, className, onPreview, showAudio = true }) {
  const common = clsx('h-full w-full object-cover', className);
  if (asset?.video_path) {
    return <VideoPane src={fileUrl(projectId, asset.video_path)} className={common} />;
  }
  if (asset?.image_path) {
    return (
      <ImagePane
        className={clsx(common, onPreview && 'cursor-zoom-in')}
        src={fileUrl(projectId, asset.image_path)}
        alt={asset.name || ''}
        onClick={onPreview}
      />
    );
  }
  const audioSrc = asset?.audio_path || asset?.voice_ref;
  if (audioSrc && showAudio) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(120%_120%_at_30%_0%,rgba(255,255,255,.05),transparent_60%)] p-3">
        <FileAudio size={18} className="text-[var(--fg-3)]" />
        <audio src={fileUrl(projectId, audioSrc)} controls className="h-8 w-full" />
      </div>
    );
  }
  const Icon = asset?.category === 'video' ? Film : asset?.category === 'voice' || asset?.category === 'music' || asset?.category === 'sfx' ? FileAudio : ImageIcon;
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-[var(--fg-4)]">
      <Icon size={18} />
      <span className="text-[10.5px]">{ASSET_CATEGORY_LABEL[asset?.category] || asset?.category || '暂无预览'}</span>
    </div>
  );
}

export function AudioLine({ projectId, path, className }) {
  if (!path) return null;
  return <audio src={fileUrl(projectId, path)} controls preload="metadata" className={clsx('h-9 w-full', className)} />;
}
