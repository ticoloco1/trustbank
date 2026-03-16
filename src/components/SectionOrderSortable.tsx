"use client";

import { DndContext, closestCenter, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const BLOCKS = [
  { id: "cotacao", label: "Cotação" },
  { id: "posts", label: "Posts / Ideias" },
] as const;

type BlockId = (typeof BLOCKS)[number]["id"];

function SortableItem({
  id,
  label,
}: {
  id: BlockId;
  label: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.6rem 0.75rem",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        marginBottom: "0.5rem",
        cursor: "grab",
      }}
      {...attributes}
      {...listeners}
    >
      <span style={{ fontSize: "1.25rem" }}>⋮⋮</span>
      <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

type Props = {
  value: "cotacao_first" | "posts_first";
  onChange: (value: "cotacao_first" | "posts_first") => void;
  disabled?: boolean;
};

export default function SectionOrderSortable({ value, onChange, disabled }: Props) {
  const order: BlockId[] = value === "posts_first" ? ["posts", "cotacao"] : ["cotacao", "posts"];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id) as BlockId;
    const overId = String(over.id) as BlockId;
    const oldIndex = order.indexOf(activeId);
    const newIndex = order.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove([...order], oldIndex, newIndex);
    onChange(newOrder[0] === "posts" ? "posts_first" : "cotacao_first");
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <div style={{ opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? "none" : undefined }}>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>
            Arraste para mudar a ordem no layout de 2 ou 3 colunas.
          </p>
          {order.map((id) => (
            <SortableItem key={id} id={id} label={BLOCKS.find((b) => b.id === id)!.label} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
