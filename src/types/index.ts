export interface ITorrent {
  title: string;
  description: string;
  releaseDate: string;
  authorsNickname: string;
  magneteLink: string;
  downloadLink: string;
  gratefulPeopleList: {
    nickname: string;
    date: string;
  }[];
}
