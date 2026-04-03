import React from 'react';
import { 
  Building2 as BuildingIcon, 
  MapPin as MapIcon, 
  Globe as GlobeIcon, 
  ShieldCheck as ShieldIcon, 
  Smartphone as SmartphoneIcon, 
  Star as StarIcon, 
  Facebook as FacebookIcon, 
  Music2 as MusicIcon 
} from 'lucide-react';
import { ShopSettings } from '../../types';

interface BusinessProfileProps {
  settings: ShopSettings | null;
  setSettings: React.Dispatch<React.SetStateAction<ShopSettings | null>>;
}

export default function BusinessProfile({ settings, setSettings }: BusinessProfileProps) {
  return (
    <section className="bg-white rounded-[2rem] border border-surface-200 overflow-hidden shadow-premium">
      <div className="p-8 border-b border-surface-100 bg-surface-50/50">
        <h3 className="text-xl font-display font-black flex items-center gap-3 text-surface-900">
          <div className="p-2 bg-brand-50 text-brand-500 rounded-xl">
            <BuildingIcon size={24} />
          </div>
          Perfil do Negócio
        </h3>
      </div>
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Nome do Estabelecimento</label>
            <div className="relative group">
              <BuildingIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-500 transition-colors" size={20} />
              <input
                type="text"
                value={settings?.name || ''}
                onChange={e => setSettings(s => s ? {...s, name: e.target.value} : null)}
                className="input-premium pl-12"
                placeholder="Ex: Studio Glow"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Link Exclusivo (Slug)</label>
            <div className="relative group">
              <GlobeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-500 transition-colors" size={20} />
              <input
                type="text"
                value={settings?.slug || ''}
                onChange={e => setSettings(s => s ? {...s, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')} : null)}
                className="input-premium pl-12 pr-28 font-bold text-brand-500"
                placeholder="ex: studio-glow"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-300 text-[10px] font-black uppercase tracking-tighter">.dodile.com.br</span>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">CNPJ (Opcional)</label>
            <div className="relative group">
              <ShieldIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-500 transition-colors" size={20} />
              <input
                type="text"
                value={settings?.cnpj || ''}
                onChange={e => setSettings(s => s ? {...s, cnpj: e.target.value} : null)}
                className="input-premium pl-12"
                placeholder="00.000.000/0001-00"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Telefone de Contato</label>
            <div className="relative group">
              <SmartphoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-500 transition-colors" size={20} />
              <input
                type="text"
                value={settings?.phone || ''}
                onChange={e => setSettings(s => s ? {...s, phone: e.target.value} : null)}
                className="input-premium pl-12"
                placeholder="55 11 99999-9999"
              />
            </div>
          </div>
          <div className="space-y-3 md:col-span-2">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Endereço Completo</label>
            <div className="relative group">
              <MapIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-500 transition-colors" size={20} />
              <input
                type="text"
                value={settings?.address || ''}
                onChange={e => setSettings(s => s ? {...s, address: e.target.value} : null)}
                className="input-premium pl-12"
                placeholder="Rua, Número, Bairro, Cidade - UF"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Instagram Business</label>
            <div className="relative group">
              <StarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-500 transition-colors" size={20} />
              <input
                type="text"
                value={settings?.instagram || ''}
                onChange={e => setSettings(s => s ? {...s, instagram: e.target.value} : null)}
                className="input-premium pl-12"
                placeholder="@seu.salao"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Facebook Fanpage</label>
            <div className="relative group">
              <FacebookIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-500 transition-colors" size={20} />
              <input
                type="text"
                value={settings?.facebook || ''}
                onChange={e => setSettings(s => s ? {...s, facebook: e.target.value} : null)}
                className="input-premium pl-12"
                placeholder="facebook.com/seusalao"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
