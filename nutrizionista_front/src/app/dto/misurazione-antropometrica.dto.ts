import { ClienteDto } from "./cliente.dto";

export interface MisurazioneAntropometricaDto {
  id?: number;
  spalle?: number;
  vita?: number;
  fianchi?: number;
  torace?: number;
  gambaS?: number;
  gambaD?: number;
  bicipiteS?: number;
  bicipiteD?: number;
  dataMisurazione?: string; 
  cliente?: ClienteDto;
  createdAt?: string; 
  updatedAt?: string; 
}

export interface MisurazioneAntropometricaFormDto {
  id?: number;
  spalle?: number;
  vita?: number;
  fianchi?: number;
  torace?: number;
  gambaS?: number;
  gambaD?: number;
  bicipiteS?: number;
  bicipiteD?: number;
  dataMisurazione?: string; 
  cliente: ClienteDto; 
}
