export declare type Serveur = {
  _id: string;
  nom: string;
  description: string;
  urlLogo: string;
  public: boolean;
  salons:{ 
    id: number, 
    name: string }[];
    messages: {
      salonId: number;
      content: string;
      userId: string;
      email: string;
      urlAvatar: string;
    }[];
  blacklist: string[];
    
};
