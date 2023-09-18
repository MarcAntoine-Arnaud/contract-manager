// Policy Enforcement Point
import { Request, Response, NextFunction } from 'express';
import pdp, { PDPAction, PDPPolicy } from 'services/pdp.service';
import pip from 'services/pip.service';

const pep = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy: PDPPolicy = pip.buildAuthenticationPolicy(req);
    const isAuthorized = await pdp.evalPolicy(policy);
    if (isAuthorized) {
      next();
    } else {
      res
        .status(403)
        .json({ error: 'Unauthorized. Security policies not met.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default pep;
