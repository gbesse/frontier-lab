import { World, defaultSeed } from '@gbesse/branch-lab';
import { recordDemo } from '@gbesse/teachpack';
export const heldOut = { customerId: 'c-delta', sku: 'lamp', quantity: 4 };
export const demonstrations = () =>
  [
    { customerId: 'c-alice', sku: 'lamp', quantity: 2 },
    { customerId: 'c-benoit', sku: 'chair', quantity: 3 },
    { customerId: 'c-clara', sku: 'desk', quantity: 1 },
  ].map((inputs) => recordDemo(new World(defaultSeed()), inputs));
export const exitSource = {
  customers: [
    { id: 'c-1', name: 'Maison Lenoir', email: 'contact@example.test' },
    { id: 'c-2', name: 'Atelier Girard', email: 'atelier@example.test' },
  ],
  tickets: [
    {
      id: 'i-101',
      customerId: 'c-1',
      title: 'Installer les luminaires',
      status: 'scheduled',
      notes: 'Prévoir deux points lumineux.',
    },
    {
      id: 'i-102',
      customerId: 'c-2',
      title: 'Réviser les postes de travail',
      status: 'open',
      notes: 'Prendre rendez-vous.',
    },
    {
      id: 'i-103',
      customerId: 'c-1',
      title: 'Contrôler le tableau',
      status: 'done',
      notes: 'Compte rendu en pièce jointe.',
    },
  ],
  attachments: [
    {
      id: 'a-1',
      ticketId: 'i-103',
      filename: 'compte-rendu.txt',
      contentBase64: Buffer.from('Démonstration synthétique — contrôle terminé.').toString(
        'base64',
      ),
    },
  ],
};
