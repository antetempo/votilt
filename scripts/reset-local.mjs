console.error(
  'Reset distruttivo disabilitato. Il database conserva i tuoi dati. Per aggiornare usa npm run db:migrate e npm run seed. Per un nuovo collaudo usa il database isolato votilt_test.',
);
process.exitCode = 1;
