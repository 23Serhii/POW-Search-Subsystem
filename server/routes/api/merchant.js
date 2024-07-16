const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Bring in Models & Helpers
const { MERCHANT_STATUS, ROLES } = require('../../constants');
const Merchant = require('../../models/merchant');
const User = require('../../models/user');
const Brand = require('../../models/brand');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const Product = require('../../models/product');

const mailgun = require('../../services/mailgun');
// add merchant api
const upload = require('./multer-setup');
const merchant = require('../../models/merchant');
const Address = require('../../models/address');

router.post('/add', auth, upload.single('photo'), async (req, res) => {
  const {
    name,
    business,
    phoneNumber,
    email,
    brandName,
    birthDate,
    citizenship,
    relative,
    details,
    features,
    docsName,
    armyDepartment,
    dateOfPrisoning,
    placeOfDissapear,
    healthState,
    position,
    idCodePow
  } = req.body;
  const photo = req.file;
  const user = req.user;

  if (!name || !email) {
    return res
      .status(400)
      .json({ error: "Ви повинні ввести своє ім'я та електронну пошту." });
  }

  if (!business) {
    return res.status(400).json({ error: 'Ви повинні ввести опис бізнесу.' });
  }

  if (!phoneNumber) {
    return res.status(400).json({
      error: 'Ви повинні ввести номер телефону та адресу електронної пошти.'
    });
  }

  const merchant = new Merchant({
    name,
    email,
    business,
    phoneNumber,
    brandName,
    birthDate,
    citizenship,
    relative,
    details,
    features,
    docsName,
    armyDepartment,
    dateOfPrisoning,
    placeOfDissapear,
    healthState,
    position,
    idCodePow,
    photo: photo ? photo.path : null,
    user: user._id // Зв'язок з користувачем
  });

  try {
    const merchantDoc = await merchant.save();

    const address = name;
    const zipCode = phoneNumber;

    const newAddress = new Address({
      address,
      zipCode,
      user: user._id, // Зв'язок з користувачем
      status: 'Не підтверджено'
    });

    const addressDoc = await newAddress.save();

    // Відправка листа електронною поштою
    await mailgun.sendEmail(email, 'merchant-application');

    res.status(200).json({
      success: true,
      message: `Ми отримали вашу заявку. Ми з вами зв'яжемось через вашу електронну пошту ${email}!`,
      merchant: merchantDoc,
      address: addressDoc // Повернення створеної адреси
    });
  } catch (error) {
    return res.status(400).json({
      error:
        'Ваша заявка не може бути опрацьована. Будь-ласка, спробуйте ще раз.'
    });
  }
});

// fetch all merchants api
router.get('/', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const merchants = await Merchant.find()
      .populate('user') // Додаємо populate для користувача
      .populate('brand')
      .sort('-created')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Merchant.countDocuments();

    res.status(200).json({
      merchants,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      count
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});
// disable merchant account
router.put('/:id/active', auth, async (req, res) => {
  try {
    const merchantId = req.params.id;
    const update = req.body.merchant;
    const query = { _id: merchantId };

    const merchantDoc = await Merchant.findOneAndUpdate(query, update, {
      new: true
    });

    if (!update.isActive) {
      await deactivateBrand(merchantId);
      await mailgun.sendEmail(merchantDoc.email, 'merchant-deactivate-account');
    }

    res.status(200).json({
      success: true
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.put('/approve/:id', auth, async (req, res) => {
  try {
    const merchantId = req.params.id;
    const query = { _id: merchantId };
    const update = {
      status: MERCHANT_STATUS.Approved,
      isActive: true
    };

    const merchantDoc = await Merchant.findOneAndUpdate(query, update, {
      new: true
    });

    if (!merchantDoc) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    console.log('Merchant:', merchantDoc);

    // Переконайтеся, що user існує в merchantDoc
    if (!merchantDoc.user) {
      return res
        .status(400)
        .json({ error: 'User ID is missing in merchant document' });
    }

    // Додаткове логування для перевірки userId
    console.log('User ID:', merchantDoc.user);

    // Оновлення статусу адреси
    const addressUpdate = {
      status: 'Підтверджено',
      updated: Date.now()
    };

    const addressResult = await Address.updateMany(
      { user: merchantDoc.user },
      addressUpdate
    );

    console.log('Address update result:', addressResult);

    await createMerchantUser(
      merchantDoc.email,
      merchantDoc.name,
      merchantDoc.details,
      merchantDoc.phoneNumber,
      merchantDoc.brandName,
      merchantDoc.business,
      merchantDoc.birthDate,
      merchantDoc.citizenship,
      merchantDoc.relative,
      merchantDoc.docsName,
      merchantDoc.armyDepartment,
      merchantDoc.dateOfPrisoning,
      merchantDoc.placeOfDissapear,
      merchantDoc.healthState,
      merchantDoc.position,
      merchantDoc.features,
      merchantDoc.idCodePow,
      merchantId,
      req.headers.host
    );

    res.status(200).json({
      success: true,
      message: 'Merchant and address status updated successfully'
    });
  } catch (error) {
    console.error('Error updating merchant and address:', error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// reject merchant
router.put('/reject/:id', auth, async (req, res) => {
  try {
    const merchantId = req.params.id;

    const query = { _id: merchantId };
    const update = {
      status: MERCHANT_STATUS.Rejected
    };

    await Merchant.findOneAndUpdate(query, update, {
      new: true
    });

    res.status(200).json({
      success: true
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.post('/signup/:token', async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ error: 'You must enter an email address.' });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'You must enter your full name.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'You must enter a password.' });
    }

    const userDoc = await User.findOne({
      email,
      resetPasswordToken: req.params.token
    });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const query = { _id: userDoc._id };
    const update = {
      email,
      firstName,
      lastName,
      password: hash,
      resetPasswordToken: undefined
    };

    await User.findOneAndUpdate(query, update, {
      new: true
    });

    const merchantDoc = await Merchant.findOne({
      email
    });

    await createMerchantBrand(merchantDoc);

    res.status(200).json({
      success: true
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.delete(
  '/delete/:id',
  auth,
  role.check(ROLES.Admin),
  async (req, res) => {
    try {
      const merchantId = req.params.id;
      await deactivateBrand(merchantId);
      const merchant = await Merchant.deleteOne({ _id: merchantId });

      res.status(200).json({
        success: true,
        message: `Зміни внесено успішно.`,
        merchant
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

const deactivateBrand = async merchantId => {
  const merchantDoc = await Merchant.findOne({ _id: merchantId }).populate(
    'brand',
    '_id'
  );
  if (!merchantDoc || !merchantDoc.brand) return;
  const brandId = merchantDoc.brand._id;
  const query = { _id: brandId };
  const update = {
    isActive: false
  };
  return await Brand.findOneAndUpdate(query, update, {
    new: true
  });
};

const createMerchantUser = async (
  email,
  name,
  details,
  phoneNumber,
  brandName,
  business,
  birthDate,
  citizenship,
  relative,
  docsName,
  armyDepartment,
  dateOfPrisoning,
  placeOfDissapear,
  healthState,
  position,
  features,
  idCodePow,
  merchant,
  host
) => {
  const description = details;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const query = { _id: existingUser._id };
    const update = {
      merchant,
      role: ROLES.Merchant
    };

    await mailgun.sendEmail(email, 'merchant-welcome', null, name);

    return await User.findOneAndUpdate(query, update, {
      new: true
    });
  } else {
    const buffer = await crypto.randomBytes(48);
    const resetToken = buffer.toString('hex');
    const resetPasswordToken = resetToken;

    const phoneNumberPow = phoneNumber;
    const cityLivePow = brandName;
    const milPartPow = business;
    const birthDatePow = birthDate;
    const citizenshipPow = citizenship;
    const sku = relative;

    console.log(relative);
    const product = new Product({
      name,
      description,
      phoneNumberPow,
      cityLivePow,
      milPartPow,
      birthDatePow,
      citizenshipPow,
      sku,
      docsName,
      armyDepartment,
      dateOfPrisoning,
      placeOfDissapear,
      healthState,
      position,
      features,
      idCodePow
    });

    await mailgun.sendEmail(email, 'merchant-signup', host, {
      resetToken,
      email
    });

    return await product.save();
  }
};

module.exports = router;
