import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Serveur } from '../../models/serveur.type';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [MatIconModule, RouterLink, MatTooltipModule, NgIf, NgFor, FormsModule, MatFormField],
  templateUrl: './principal.component.html',
  styleUrls: ['./principal.component.scss'],
})
export class PrincipalComponent implements OnInit {
  http: HttpClient = inject(HttpClient);
  listeServeur: Serveur[] = [];
  isCreatingSalon = false;
  newSalonName = '';
  selectedServerId: string | null = null;
  newMessageContent = '';
  user: any = null;
  selectedSalonId: number | null = null;
  messagesForSelectedSalon: any[] = [];
  showBlacklistButton: string | null = null;

  ngOnInit() {
    const jwt = localStorage.getItem('jwt');

    if (jwt) {
      this.http.get<Serveur[]>('http://localhost:3000/serveur/possede')
        .subscribe((listeServeur) => {
          this.http.get('http://localhost:3000/me')
            .subscribe((user) => {
              this.user = user;
              this.updateServeurs(listeServeur);
            });
        });
    }
  }

  updateServeurs(listeServeur: Serveur[]) {
    this.listeServeur = listeServeur.filter(serveur => !serveur.blacklist.includes(this.user._id));
  }

  selectServer(serverId: string) {
    this.selectedServerId = serverId;
    this.selectedSalonId = null;
    this.messagesForSelectedSalon = [];
  }

  selectSalon(salonId: number) {
    this.selectedSalonId = salonId;
    this.updateMessagesForSelectedSalon();
  }

  toggleCreateSalon() {
    this.isCreatingSalon = true;
  } 

  addSalon() {
    if (this.newSalonName.trim() && this.selectedServerId) {
      this.http.post<Serveur>(`http://localhost:3000/serveur/${this.selectedServerId}/salon`, { name: this.newSalonName })
        .subscribe((response: Serveur) => {
          console.log('Salon ajouté:', response);
          const serveurIndex = this.listeServeur.findIndex(s => s._id === this.selectedServerId);
          if (serveurIndex !== -1) {
            this.listeServeur[serveurIndex] = response;
            console.log('Updated listeServeur:', this.listeServeur);
          }
        });
    }
    this.newSalonName = '';
    this.isCreatingSalon = false;
  }

  cancelCreateSalon() {
    this.newSalonName = '';
    this.isCreatingSalon = false;
  }

  sendMessage() {
    if (this.newMessageContent.trim() && this.selectedServerId && this.selectedSalonId !== null) {
      const userId = this.user._id;
      const email = this.user.email;
      const urlAvatar = this.user.urlAvatar || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXZ6Vw-Br-RRvMstTlTqbeGXw4PNepXRrTzg&s';
      this.http.post<Serveur>(`http://localhost:3000/serveur/${this.selectedServerId}/salon/${this.selectedSalonId}/message`, { content: this.newMessageContent, userId, email, urlAvatar })
        .subscribe((response: Serveur) => {
          console.log('Message envoyé:', response);
          const serveurIndex = this.listeServeur.findIndex(s => s._id === this.selectedServerId);
          if (serveurIndex !== -1) {
            this.listeServeur[serveurIndex] = response;
            this.updateMessagesForSelectedSalon();
          }
        });
      this.newMessageContent = '';
    }
  }

  getSelectedServer() {
    return this.listeServeur.find(s => s._id === this.selectedServerId) || { salons: [], messages: [] };
  }

  updateMessagesForSelectedSalon() {
    const selectedServer = this.getSelectedServer();
    if (this.selectedSalonId !== null && selectedServer && selectedServer.messages) {
      this.messagesForSelectedSalon = selectedServer.messages.filter(message => message.salonId === this.selectedSalonId);
    } else {
      this.messagesForSelectedSalon = [];
    }
  }

  addToBlacklist(userId: string) {
    if (this.selectedServerId) {
      this.http.post(`http://localhost:3000/serveur/${this.selectedServerId}/blacklist`, { userId })
        .subscribe(response => {
          console.log('User added to blacklist:', response);
          this.http.get<Serveur[]>('http://localhost:3000/serveur/possede')
            .subscribe((listeServeur) => {
              this.updateServeurs(listeServeur);
            });
        });
    } else {
      console.error('No server selected');
    }
  }

  toggleBlacklistButton(messageId: string) {
    this.showBlacklistButton = this.showBlacklistButton === messageId ? null : messageId;
  }

  trackByMessage(message: any) {
    return message._id;
  }
}
