import Appointment from '../models/appointments';
import User from '../models/user';
import File from '../models/file';
import Notification from '../schemas/notification';
import pt from 'date-fns/locale/pt';

import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format } from 'date-fns';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      limit: 20,
      offset:(page - 1 * 20),
      attributes: ['id', 'date'],
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url']
            }
          ]
        }
      ]
    });

    return res.send(appointments);
  }

  async store(req, res) {

    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required()
    });

    if(!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { provider_id, date } = req.body;

    /*
    * Check if provider_id is provider
    */

    const isProvider = await User.findOne({
      where: {
        id: provider_id, provider: true
      }
    });

    if(!isProvider) {
      return res.status(401).json({ error: 'You can only create appointments with providers' })
    }

    /**
     * Check if provider_id is the user logged
     */

    if(provider_id === req.userId) {
      return res.status(401).json({ error: 'You can only create appointments with another users' })
    }

    const hourStart = startOfHour(parseISO(date));

    /**
     * Check for past dates
     */
    if(isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    /**
     * Check date availability
     */
    const checkAvailabiliry = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart
      }
    });

    if(checkAvailabiliry) {
      return res.status(400).json({ error: 'Appointment date is not available' });
    }

    const appointments = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date
    })

    /**
     * Notify appointment provider
     */

    const user = await User.findByPk(req.userId);
    const formattedDate = format(hourStart, "'dia' dd 'de' MMMM', ás' H:mm'h'", {
      locale: pt
    });

     await Notification.create({
       content: `Novo agendamento de ${user.name} para ${formattedDate}`,
       user: provider_id
     })

    return res.json(appointments);

  }
};

export default new AppointmentController();
