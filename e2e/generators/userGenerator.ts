import { faker } from '@faker-js/faker';
import { Role, RegisterRequest } from '../../src/types/auth';

const MAX_ATTEMPTS = 20;

export const getRandomUser = (): RegisterRequest => ({
  username: drawValidValue(() => faker.internet.username(), 4, 255),
  email: faker.internet.email(),
  password: drawValidValue(() => faker.internet.password(), 8, 255),
  firstName: drawValidValue(() => faker.person.firstName(), 4, 255),
  lastName: drawValidValue(() => faker.person.lastName(), 4, 255),
  roles: [Role.CLIENT, Role.ADMIN],
});

const drawValidValue = (draw: () => string, min: number, max: number): string => {
    let attempts = 0;
    let value = '';
    while (attempts < MAX_ATTEMPTS) {
      value = draw();
      if (value.length >= min && value.length <= max) {
        return value;
      }
      attempts++;
    }
    if (value.length < min) {
      value = value.padEnd(min, 'a');
    }
    if (value.length > max) {
      value = value.substring(0, max);
    }
    return value;
  };