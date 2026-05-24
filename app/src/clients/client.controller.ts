import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Client } from './client.model';

const PAGE_DEFAULT  = 1;
const LIMIT_DEFAULT = 20;

export const listClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const page  = parseInt(req.query.page  as string ?? String(PAGE_DEFAULT),  10);
    const limit = parseInt(req.query.limit as string ?? String(LIMIT_DEFAULT), 10);

    const filter: Record<string, unknown> = {};
    if (req.query.status)                   filter.status                  = req.query.status;
    if (req.query.countryOfOrigin)          filter.countryOfOrigin         = req.query.countryOfOrigin;
    if (req.query.currentImmigrationStatus) filter.currentImmigrationStatus = req.query.currentImmigrationStatus;

    const [clients, total] = await Promise.all([
      Client.find(filter).skip((page - 1) * limit).limit(limit).sort({ fullName: 1 }),
      Client.countDocuments(filter),
    ]);

    res.json({ data: clients, page, limit, total });
  } catch (err) {
    next(err);
  }
};

export const getClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) { res.status(404).json({ error: 'Client not found' }); return; }
    res.json(client);
  } catch (err) {
    next(err);
  }
};

export const createClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
};

export const updateClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!client) { res.status(404).json({ error: 'Client not found' }); return; }
    res.json(client);
  } catch (err) {
    next(err);
  }
};

export const deleteClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) { res.status(404).json({ error: 'Client not found' }); return; }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
