import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import LeadCard from "./LeadCard";
import { Users } from "lucide-react";

const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

const stageAccents = {
  New: "bg-blue-500",
  Contacted: "bg-amber-500",
  Qualified: "bg-emerald-500",
  Proposal: "bg-purple-500",
  Won: "bg-green-500",
  Lost: "bg-red-400",
};

export default function PipelineBoard({ leads, onDragEnd, onLeadClick }) {
  const grouped = {};
  STAGES.forEach((s) => (grouped[s] = []));
  leads.forEach((lead) => {
    if (grouped[lead.stage]) grouped[lead.stage].push(lead);
  });

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
        {STAGES.map((stage) => (
          <Droppable droppableId={stage} key={stage}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-shrink-0 w-72 rounded-2xl border border-border/60 bg-muted/40 transition-colors duration-200
                  ${snapshot.isDraggingOver ? "bg-primary/5 border-primary/30" : ""}`}
              >
                {/* Column Header */}
                <div className="px-4 py-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stageAccents[stage]}`} />
                      <span className="text-sm font-semibold text-foreground">{stage}</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                      {grouped[stage].length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 min-h-[100px]">
                  {grouped[stage].map((lead, index) => (
                    <Draggable key={lead.id} draggableId={String(lead.id)} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`transition-shadow ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20 rounded-xl" : ""}`}
                        >
                          <LeadCard
                            lead={lead}
                            onClick={onLeadClick}
                            dragHandleProps={provided.dragHandleProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}

                  {grouped[stage].length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50">
                      <Users className="w-6 h-6 mb-1" />
                      <span className="text-xs">No leads</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}