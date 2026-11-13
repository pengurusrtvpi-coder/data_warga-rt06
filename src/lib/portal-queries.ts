import { queryOptions } from '@tanstack/react-query';
import { fetchFinance, fetchSurat } from './warga';
export const financeOptions=queryOptions({queryKey:['finance'],queryFn:fetchFinance});
export const suratOptions=queryOptions({queryKey:['surat'],queryFn:fetchSurat});