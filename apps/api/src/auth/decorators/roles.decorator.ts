import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/trading/entities/trading-user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
