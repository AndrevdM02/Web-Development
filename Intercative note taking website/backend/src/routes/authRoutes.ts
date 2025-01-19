import express, { Router } from 'express';

const router = Router();

router.use(express.json({type: "*/*"})); //enable JSON parsing


