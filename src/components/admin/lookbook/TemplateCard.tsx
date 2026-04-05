interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  selected?: boolean;
  onSelect: (id: string) => void;
}

export default function TemplateCard({ id, name, description, selected, onSelect }: TemplateCardProps) {
  return (
    <button
      type="button"
      className={`template-card${selected ? " template-card--selected" : ""}`}
      onClick={() => onSelect(id)}
    >
      <div className="template-card__preview">
        <div className="template-card__preview-inner">
          {/* Visual representation of the template */}
          {id === "collection" && (
            <div className="template-card__grid-preview">
              <div /><div /><div />
              <div /><div /><div />
            </div>
          )}
          {id === "lifestyle" && (
            <div className="template-card__lifestyle-preview">
              <div className="template-card__preview-hero" />
              <div className="template-card__preview-row">
                <div /><div />
              </div>
            </div>
          )}
          {id === "minimal" && (
            <div className="template-card__minimal-preview">
              <div className="template-card__preview-line template-card__preview-line--wide" />
              <div className="template-card__preview-line" />
              <div className="template-card__preview-line" />
            </div>
          )}
        </div>
      </div>
      <div className="template-card__body">
        <p className="template-card__name">{name}</p>
        <p className="template-card__desc">{description}</p>
      </div>
      {selected && <span className="template-card__check">&#10003;</span>}
    </button>
  );
}
