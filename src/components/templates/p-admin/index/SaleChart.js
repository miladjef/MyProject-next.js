"use client";
import React from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function SaleChart({ data = [] }) {
  const chartData = data.length ? data : [{ date: "-", sale: 0 }];
  return <ResponsiveContainer width="100%" height="92.7%"><AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Area type="monotone" dataKey="sale" stroke="#000" fill="#711D1C" /></AreaChart></ResponsiveContainer>;
}
export default SaleChart;
