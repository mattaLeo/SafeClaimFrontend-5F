import { Routes } from '@angular/router';
import { Automobilista } from './automobilista/automobilista';
import { Perito } from './perito/perito';
import { Assicurazione } from './assicurazione/assicurazione';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Info } from './info/info';
import { NuovoSinistroComponent } from './nuovo-sinistro/nuovo-sinistro.component';
import { ListaVeicoli } from './lista-veicoli/lista-veicoli';

export const routes: Routes = [
    {path: "automobilista", component: Automobilista},
    {path: "perito", component: Perito},
    {path: "assicurazione", component: Assicurazione},
    {path: "signin", component: Login},
    {path: "signup", component: Signup},
    {path: "info", component: Info},
    {path: "nuovo-sinistro", component: NuovoSinistroComponent},
    {path: "veicoli", component: ListaVeicoli},
];