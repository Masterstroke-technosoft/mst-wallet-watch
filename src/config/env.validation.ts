import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsUrl({ require_tld: false })
  @IsOptional()
  TESTNET_RPC_URL?: string = 'https://testnetrpc.mstblockchain.com';

  @IsUrl({ require_tld: false })
  @IsOptional()
  MAINNET_RPC_URL?: string = 'https://mariorpc.mstblockchain.com';

  @IsNumber()
  @IsOptional()
  TESTNET_CHAIN_ID?: number = 91562037;

  @IsNumber()
  @IsOptional()
  MAINNET_CHAIN_ID?: number = 4646;

  @IsString()
  @IsOptional()
  TESTNET_CURRENCY_SYMBOL?: string = 'tMSTC';

  @IsString()
  @IsOptional()
  MAINNET_CURRENCY_SYMBOL?: string = 'MSTC';

  @IsString()
  @IsOptional()
  WALLETS_TO_MONITOR?: string;

  @IsNumber()
  @IsOptional()
  BALANCE_THRESHOLD_TESTNET?: number = 0.1;

  @IsNumber()
  @IsOptional()
  BALANCE_THRESHOLD_MAINNET?: number = 0.1;

  @IsString()
  @IsOptional()
  CHECK_INTERVAL?: string;

  @IsString()
  @IsOptional()
  CHECK_INTERVAL_CRON?: string;

  @IsBoolean()
  @IsOptional()
  RUN_ON_STARTUP?: boolean = true;

  @IsString()
  @IsOptional()
  SMTP_HOST?: string;

  @IsNumber()
  @IsOptional()
  SMTP_PORT?: number = 587;

  @IsBoolean()
  @IsOptional()
  SMTP_SECURE?: boolean = false;

  @IsString()
  @IsOptional()
  SMTP_USER?: string;

  @IsString()
  @IsOptional()
  SMTP_PASS?: string;

  @IsString()
  @IsOptional()
  EMAIL_FROM?: string;

  @IsString()
  @IsOptional()
  EMAIL_TO?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
