import React, { useId } from 'react';

/**
 * Champ fichier stylisé : « Importer » si aucune image enregistrée, « Modifier » / « Remplacer » sinon.
 */
const ImagePicker = ({
  id,
  accept = 'image/*',
  file,
  onChange,
  compact = false,
  hasExistingImage = false
}) => {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const pickedName = file?.name || null;

  const actionText = file
    ? hasExistingImage
      ? "Remplacer l'image"
      : 'Image sélectionnée'
    : hasExistingImage
      ? "Modifier l'image"
      : 'Importer votre image';

  const detailText = pickedName
    ? pickedName
    : hasExistingImage
      ? 'Image enregistrée'
      : 'Aucun fichier';

  const hint = `${actionText} — ${detailText}`;

  return (
    <div className={`flex min-h-0 w-full ${compact ? 'h-9' : 'h-full'}`}>
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      <label
        htmlFor={inputId}
        title={hint}
        className={
          compact
            ? 'flex h-9 w-full cursor-pointer flex-row items-center gap-2 rounded border border-dashed border-[#c19d60]/45 bg-[#0b1f1e]/90 px-2 transition-colors hover:border-[#c19d60] hover:bg-[#c19d60]/10'
            : 'flex w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded border border-dashed border-[#c19d60]/45 bg-[#0b1f1e]/90 px-2 py-2 text-center transition-colors hover:border-[#c19d60] hover:bg-[#c19d60]/10'
        }
      >
        {compact ? (
          <>
            <span className="shrink-0 text-base font-light leading-none text-[#c19d60]" aria-hidden>
              +
            </span>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-px overflow-hidden text-left">
              <span className="truncate text-[8px] font-medium uppercase tracking-[0.1em] text-white/80 leading-none">
                {actionText}
              </span>
              <span className="truncate text-[6px] leading-tight text-white/40">{detailText}</span>
            </div>
          </>
        ) : (
          <>
            <span className="text-base font-light leading-none text-[#c19d60]" aria-hidden>
              +
            </span>
            <span className="text-[8px] font-medium uppercase tracking-[0.12em] text-white/75">
              {actionText}
            </span>
            <span className="max-w-full truncate text-[8px] text-white/45" title={pickedName || undefined}>
              {detailText}
            </span>
          </>
        )}
      </label>
    </div>
  );
};

export default ImagePicker;
