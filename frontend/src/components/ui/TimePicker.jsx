import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TimePicker({ value, onChange }) {
  const [hours, setHours] = useState("12");
  const [minutes, setMinutes] = useState("00");
  const [period, setPeriod] = useState("AM");

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      const numH = parseInt(h, 10);
      setMinutes(m || "00");
      if (numH === 0) {
        setHours("12");
        setPeriod("AM");
      } else if (numH === 12) {
        setHours("12");
        setPeriod("PM");
      } else if (numH > 12) {
        setHours((numH - 12).toString().padStart(2, "0"));
        setPeriod("PM");
      } else {
        setHours(numH.toString().padStart(2, "0"));
        setPeriod("AM");
      }
    }
  }, [value]);

  const updateTime = (h, m, p) => {
    let numH = parseInt(h, 10);
    if (p === "PM" && numH !== 12) {
      numH += 12;
    } else if (p === "AM" && numH === 12) {
      numH = 0;
    }
    const formattedH = numH.toString().padStart(2, "0");
    onChange(`${formattedH}:${m}`);
  };

  const handleHoursChange = (val) => {
    setHours(val);
    updateTime(val, minutes, period);
  };

  const handleMinutesChange = (val) => {
    setMinutes(val);
    updateTime(hours, val, period);
  };

  const handlePeriodChange = (val) => {
    setPeriod(val);
    updateTime(hours, minutes, val);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={hours} onValueChange={handleHoursChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 12 }, (_, i) => {
            const h = (i + 1).toString().padStart(2, "0");
            return (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <span className="text-gray-500 font-bold">:</span>
      <Select value={minutes} onValueChange={handleMinutesChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {["00", "15", "30", "45"].map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={period} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="AM/PM" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
