import Joi from 'joi';
import joi from '@joi/date';
const extendedJoi = Joi.extend(joi)

const schemaGames= Joi.object({
    name: Joi.string().min(1).required(),
    stockTotal: Joi.number().greater(0).required(),
    pricePerDay: Joi.number().greater(0).required(),
    image: Joi.string().required(),
    categoryId: Joi.number().required(),
});

const schemaCustomers= Joi.object({
    name: Joi.string().min(1).required(),
    phone: Joi.string().min(10).max(11).required(),
    cpf: Joi.string().min(11).max(11).required(),
    birthday: extendedJoi.date().format('YYYY-MM-DD').utc(),
});

export{
    schemaGames,
    schemaCustomers
}