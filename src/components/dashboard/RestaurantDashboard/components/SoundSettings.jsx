import React from 'react';
import { Volume2, VolumeX, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SOUND_TYPES = [
  { value: 'classic', label: 'Clássico' },
  { value: 'bell', label: 'Sino' },
  { value: 'chime', label: 'Carilhão' },
  { value: 'beep', label: 'Beep' },
  { value: 'custom', label: 'Personalizado' }
];

export default function SoundSettings({
  soundEnabled,
  soundType,
  onSoundToggle,
  onSoundTypeChange
}) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5" />
          Configurações de Som
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {soundEnabled ? (
              <Volume2 className="h-5 w-5 text-green-500" />
            ) : (
              <VolumeX className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <p className="font-medium">Notificações Sonoras</p>
              <p className="text-sm text-gray-500">
                {soundEnabled ? 'Ativadas' : 'Desativadas'}
              </p>
            </div>
          </div>
          <Switch
            checked={soundEnabled}
            onCheckedChange={onSoundToggle}
          />
        </div>

        {soundEnabled && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Som</label>
            <Select value={soundType} onValueChange={onSoundTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de som" />
              </SelectTrigger>
              <SelectContent>
                {SOUND_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="text-xs text-gray-500">
          As notificações sonoras alertam sobre novos pedidos pendentes.
        </div>
      </CardContent>
    </Card>
  );
}
