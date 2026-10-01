import { Pipe, PipeTransform } from '@angular/core';
import { fecha, initials, money } from '../core/util';

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(v: number | null | undefined): string {
    return money(v);
  }
}

@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  transform(v: string | null | undefined): string {
    return fecha(v);
  }
}

@Pipe({ name: 'initials' })
export class InitialsPipe implements PipeTransform {
  transform(v: string): string {
    return initials(v);
  }
}

export const PIPES = [MoneyPipe, FechaPipe, InitialsPipe] as const;
