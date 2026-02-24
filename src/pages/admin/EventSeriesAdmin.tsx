import { EventSeriesManager } from "@/components/admin/EventSeriesManager";
import { useNavigate } from "react-router-dom";

export default function EventSeriesAdmin() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <EventSeriesManager
        onCreateEdition={(series, year) => {
          // Navigate to exhibitions admin with pre-filled series
          navigate(`/admin/exhibitions?series=${series.id}&year=${year}`);
        }}
      />
    </div>
  );
}
