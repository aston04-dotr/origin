const express = require('express');
const router = express.Router();
const purchasesModel = require('../models/purchases');

// Google Play Billing: вебхук/проверка покупки (заглушка — в проде подключаем google-play-billing или серверную верификацию)
router.post('/purchases/android/verify', async (req, res) => {
  try {
    const { player_id, product_id, product_type, purchase_token, order_id } = req.body;
    if (!player_id || !product_id || !product_type) {
      return res.status(400).json({ error: 'player_id, product_id, product_type required' });
    }
    // TODO: верификация через Google Play Developer API
    const existing = await purchasesModel.findByExternalId('android', order_id || purchase_token);
    if (existing) return res.json({ ok: true, already_processed: true });
    await purchasesModel.recordPurchase(player_id, product_id, product_type, 'android', order_id || purchase_token, req.body);
    await purchasesModel.addToInventory(player_id, product_id, product_type, product_type === 'booster' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// iOS: после оплаты через ЮKassa — callback с external_id
router.post('/purchases/ios/callback', async (req, res) => {
  try {
    const { player_id, product_id, product_type, external_id } = req.body;
    if (!player_id || !product_id || !product_type || !external_id) {
      return res.status(400).json({ error: 'player_id, product_id, product_type, external_id required' });
    }
    const existing = await purchasesModel.findByExternalId('ios', external_id);
    if (existing) return res.json({ ok: true, already_processed: true });
    await purchasesModel.recordPurchase(player_id, product_id, product_type, 'ios', external_id, req.body);
    await purchasesModel.addToInventory(player_id, product_id, product_type, product_type === 'booster' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/inventory/:playerId', async (req, res) => {
  try {
    const items = await purchasesModel.getInventory(req.params.playerId);
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
