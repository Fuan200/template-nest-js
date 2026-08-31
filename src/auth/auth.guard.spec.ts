import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { vi } from 'vitest';
import { verifyJwt } from './auth.utils.js';
import { AuthGuard } from './auth.guard.js';

vi.mock('./auth.utils.js', () => ({
  verifyJwt: vi.fn(),
}));

describe('AuthGuard', () => {
  let guard: AuthGuard;
  const reflector = {
    getAllAndOverride: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthGuard, { provide: Reflector, useValue: reflector }],
    }).compile();

    guard = module.get(AuthGuard);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('allows routes marked as public without checking a token', () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    expect(guard.canActivate(createContext({}))).toBe(true);
    expect(verifyJwt).not.toHaveBeenCalled();
  });

  it('rejects a request with no bearer token', () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    expect(() => guard.canActivate(createContext({ headers: {} }))).toThrow(
      new UnauthorizedException('MISSING_TOKEN'),
    );
  });

  it('attaches a verified token payload to the request', () => {
    const request = { headers: { authorization: 'Bearer signed-token' } };
    const payload = { sub: '98cffccd-a526-4ebc-8398-ad74ac720b4b', email: 'ada@example.com' };
    reflector.getAllAndOverride.mockReturnValue(false);
    vi.mocked(verifyJwt).mockReturnValue(payload);

    expect(guard.canActivate(createContext(request))).toBe(true);
    expect(verifyJwt).toHaveBeenCalledWith('signed-token');
    expect(request).toMatchObject({ user: payload });
  });

  it('rejects a malformed or expired token', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    vi.mocked(verifyJwt).mockImplementation(() => {
      throw new Error('INVALID_TOKEN');
    });

    expect(() =>
      guard.canActivate(createContext({ headers: { authorization: 'Bearer bad' } })),
    ).toThrow(new UnauthorizedException('INVALID_TOKEN'));
  });
});

function createContext(request: { headers?: { authorization?: string } }): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => vi.fn(),
    getClass: () => vi.fn(),
  } as unknown as ExecutionContext;
}
