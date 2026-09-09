import React, { useEffect, useMemo, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, deleteDoc, serverTimestamp, runTransaction } from "firebase/firestore";
import {
  Chrome, Clock, CheckCircle2, XCircle, Phone, Mail, Calendar,
  Search, Star, TrendingUp, Users, MessageCircle, CalendarOff, Trash2, Activity, Bell, BarChart3,
  ArrowUp, ArrowDown,
} from "lucide-react";
import { SERVICES, WEEKDAY_SLOTS, SUNDAY_SLOTS, formatPreco } from "../../shared/services";
import { useAuth } from "./hooks/useAuth";
import { db } from "./firebase";
import { ReviewCard } from "./ReviewsPage.jsx";
import "./styles.css";

// E-mails autorizados a ver o painel administrativo.
const ADMIN_EMAILS = ["carol.bronze26@gmail.com"];

const ADMIN_TABS = [
  { id: "andamento", label: "Andamento", icon: Activity },
  { id: "lembretes", label: "Lembretes", icon: Bell },
  { id: "cancelamento", label: "Cancelamento", icon: XCircle },
  { id: "bloqueio", label: "Bloquear data", icon: CalendarOff },
  { id: "avaliacao", label: "Avaliação", icon: Star },
  { id: "relatorio", label: "Relatório", icon: BarChart3 },
];

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function noPeriodo(dataKey, periodo, customStart, customEnd) {
  if (!dataKey) return periodo === "tudo";

  if (periodo === "custom") {
    if (!customStart || !customEnd) return true;
    return dataKey >= customStart && dataKey <= customEnd;
  }
