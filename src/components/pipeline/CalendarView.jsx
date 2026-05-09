import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, addMonths, subMonths } from "date-fns";

export default function CalendarView({ leads, onLeadClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getLeadsForDate = (date) => {
    return leads.filter(
      (lead) =>
        lead.next_action_date && isSameDay(new Date(lead.next_action_date), date)
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200";
      case "Medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200";
      case "Low":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className="p-4 bg-card">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((date, idx) => {
            const dayLeads = getLeadsForDate(date);
            const isCurrentMonth = isSameMonth(date, currentMonth);

            return (
              <div
                key={idx}
                className={`min-h-24 p-1.5 rounded-lg border transition-colors ${
                  isCurrentMonth
                    ? "bg-background border-border"
                    : "bg-muted border-border/50"
                }`}
              >
                <div
                  className={`text-xs font-semibold mb-1 ${
                    isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {format(date, "d")}
                </div>
                <div className="space-y-1 text-xs">
                  {dayLeads.slice(0, 2).map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => onLeadClick(lead)}
                      className={`w-full text-left px-1.5 py-0.5 rounded truncate ${getPriorityColor(
                        lead.priority
                      )} hover:opacity-80 transition-opacity`}
                    >
                      {lead.name}
                    </button>
                  ))}
                  {dayLeads.length > 2 && (
                    <div className="text-xs text-muted-foreground px-1.5">
                      +{dayLeads.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}