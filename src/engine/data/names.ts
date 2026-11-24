export interface NamePool { male: string[]; female: string[]; sur: string[] }

export const NAME_POOLS: Record<string, NamePool> = {
  en: {
    male: ['James', 'Oliver', 'Henry', 'Liam', 'Noah', 'Ethan', 'Jack', 'Daniel', 'Samuel', 'Owen', 'Caleb', 'Leo'],
    female: ['Emma', 'Olivia', 'Sophia', 'Grace', 'Ava', 'Chloe', 'Lily', 'Hannah', 'Ella', 'Maya', 'Isla', 'Ruby'],
    sur: ['Smith', 'Taylor', 'Brown', 'Walker', 'Hughes', 'Carter', 'Bennett', 'Reed', 'Morgan', 'Fisher', 'Hayes', 'Murphy'],
  },
  de: {
    male: ['Lukas', 'Jonas', 'Felix', 'Maximilian', 'Paul', 'Leon', 'Finn', 'Elias', 'Anton', 'Emil'],
    female: ['Mia', 'Hannah', 'Lena', 'Clara', 'Emilia', 'Sophie', 'Marie', 'Leonie', 'Greta', 'Anna'],
    sur: ['Müller', 'Schneider', 'Fischer', 'Weber', 'Becker', 'Hoffmann', 'Koch', 'Richter', 'Wolf', 'Neumann'],
  },
  fr: {
    male: ['Louis', 'Hugo', 'Gabriel', 'Jules', 'Arthur', 'Lucas', 'Théo', 'Nathan', 'Antoine', 'Maxime'],
    female: ['Léa', 'Camille', 'Chloé', 'Manon', 'Inès', 'Louise', 'Jade', 'Alice', 'Zoé', 'Margaux'],
    sur: ['Martin', 'Bernard', 'Dubois', 'Moreau', 'Laurent', 'Lefèvre', 'Girard', 'Fontaine', 'Rousseau', 'Mercier'],
  },
  ja: {
    male: ['Haruto', 'Ren', 'Sota', 'Yuto', 'Kaito', 'Daiki', 'Takumi', 'Hiroshi', 'Kenji', 'Riku'],
    female: ['Yui', 'Sakura', 'Hina', 'Aoi', 'Mio', 'Rin', 'Akari', 'Emi', 'Haruka', 'Nana'],
    sur: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato'],
  },
  ko: {
    male: ['Min-jun', 'Seo-jun', 'Ji-ho', 'Do-yun', 'Hyun-woo', 'Joon-ho', 'Tae-yang', 'Sung-min', 'Ye-jun', 'Woo-jin'],
    female: ['Seo-yeon', 'Ji-woo', 'Ha-eun', 'Soo-ah', 'Min-seo', 'Yuna', 'Da-eun', 'Chae-won', 'Ji-an', 'Eun-bi'],
    sur: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim'],
  },
  in: {
    male: ['Aarav', 'Vihaan', 'Arjun', 'Rohan', 'Kabir', 'Aditya', 'Ishaan', 'Rahul', 'Karthik', 'Dev'],
    female: ['Ananya', 'Diya', 'Aadhya', 'Priya', 'Meera', 'Kavya', 'Isha', 'Neha', 'Saanvi', 'Riya'],
    sur: ['Sharma', 'Patel', 'Iyer', 'Reddy', 'Gupta', 'Nair', 'Singh', 'Mehta', 'Das', 'Kapoor'],
  },
  pt: {
    male: ['Miguel', 'Arthur', 'Heitor', 'Gabriel', 'Davi', 'Lucas', 'Pedro', 'Rafael', 'Thiago', 'Bruno'],
    female: ['Helena', 'Alice', 'Laura', 'Manuela', 'Valentina', 'Sofia', 'Júlia', 'Beatriz', 'Isabela', 'Luna'],
    sur: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Almeida', 'Ribeiro', 'Carvalho', 'Lima'],
  },
  es: {
    male: ['Santiago', 'Mateo', 'Diego', 'Sebastián', 'Emiliano', 'Leonardo', 'Alejandro', 'Carlos', 'Javier', 'Andrés'],
    female: ['Sofía', 'Valentina', 'Camila', 'Ximena', 'Regina', 'Isabella', 'Renata', 'Lucía', 'Fernanda', 'Daniela'],
    sur: ['García', 'Hernández', 'López', 'Martínez', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Torres'],
  },
  ng: {
    male: ['Chinedu', 'Emeka', 'Tunde', 'Ibrahim', 'Oluwaseun', 'Kelechi', 'Femi', 'Chidi', 'Segun', 'Obinna'],
    female: ['Ngozi', 'Amaka', 'Funke', 'Aisha', 'Chiamaka', 'Temitope', 'Zainab', 'Ifeoma', 'Folake', 'Blessing'],
    sur: ['Okafor', 'Adeyemi', 'Balogun', 'Okonkwo', 'Eze', 'Ibrahim', 'Abubakar', 'Nwosu', 'Ogunleye', 'Bello'],
  },
  ms: {
    male: ['Aiman', 'Hafiz', 'Danish', 'Irfan', 'Farhan', 'Amir', 'Zikri', 'Haziq', 'Syafiq', 'Adam'],
    female: ['Aisyah', 'Nur Aina', 'Balqis', 'Sofea', 'Alya', 'Farah', 'Husna', 'Dania', 'Iman', 'Qistina'],
    sur: ['Abdullah', 'Rahman', 'Ismail', 'Hassan', 'Yusof', 'Hamid', 'Ahmad', 'Zakaria', 'Salleh', 'Razak'],
  },
  zh: {
    male: ['Wei', 'Jun Jie', 'Zhi Hao', 'Ethan', 'Kai Xiang', 'Jia Hao', 'Marcus', 'Ryan', 'Yi Xuan', 'Shaun'],
    female: ['Mei Ling', 'Xin Yi', 'Jia Hui', 'Rachel', 'Hui Min', 'Shu Fen', 'Chloe', 'Priscilla', 'Yu Xuan', 'Hannah'],
    sur: ['Tan', 'Lim', 'Lee', 'Ng', 'Wong', 'Chua', 'Teo', 'Goh', 'Ong', 'Koh'],
  },
};

const NICK = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Robin', 'Riley', 'Quinn', 'Morgan', 'Avery'];

import { pick, rnd } from '../rng';
import type { Gender } from '../types';

export function randomFirstName(culture: string, gender: Gender): string {
  const pool = NAME_POOLS[culture] ?? NAME_POOLS.en;
  if (gender === 'male') return pick(pool.male);
  if (gender === 'female') return pick(pool.female);
  return pick([...NICK, ...pool.male.slice(0, 3), ...pool.female.slice(0, 3)]);
}
export function randomSurname(culture: string): string {
  return pick((NAME_POOLS[culture] ?? NAME_POOLS.en).sur);
}
export function randomGender(): Gender {
  const r = rnd();
  return r < 0.485 ? 'male' : r < 0.97 ? 'female' : 'nonbinary';
}
