"use client";
import React from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function GrowthChart({ data = [] }) {
  const chartData = data.length ? data : [{ name: "-", current: 0, prev: 0 }];
  return (
    <ResponsiveContainer width="100%" height="92.7%">
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey="prev" stroke="#711D1C" />
        <Line type="monotone" dataKey="current" stroke="#000" />
      </LineChart>
    </ResponsiveContainer>
  );
}
export default GrowthChart;
