// src/hooks/usePerfumes.ts
import { useState, useEffect } from "react";
import { api } from "../services/api";

// Interface completa espelhando exatamente o PerfumeSerializer do Django
export interface PerfumeData {
  id: number;
  name: string;
  price: string;
  image_url: string;
  stock_quantity: number;
  standard_description: string;
  layman_description: string;
  specialist_description: string;
  is_active: boolean;
  categories: number[];
  // Campos que estavam faltando na interface e causando "undefined"
  rating: number;
  review_count: number;
  reviews: any[];
  top_notes: string;
  heart_notes: string;
  base_notes: string;
  store_name: string;
  shopName: string;
}

export function usePerfumes() {
  const [perfumes, setPerfumes] = useState<PerfumeData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPerfumes() {
      try {
        setLoading(true);
        // Agora com a baseURL corrigida no api.ts, a rota é simplesmente /perfumes/
        const response = await api.get<PerfumeData[]>("/perfumes/");
        
        // Log para garantir que o dado chegou antes do filtro
        console.log("Dados carregados da API:", response.data);
        
        const ativos = response.data.filter((p) => p.is_active);
        setPerfumes(ativos);
      } catch (err: any) {
        console.error("Erro na requisição:", err);
        setError(err.message || "Erro ao carregar fragrâncias.");
      } finally {
        setLoading(false);
      }
    }

    fetchPerfumes();
  }, []);

  return { perfumes, loading, error };
}