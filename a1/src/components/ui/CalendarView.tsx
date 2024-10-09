import React from 'react';
import Scheduler, { SchedulerData, ViewType, DATE_FORMAT } from "react-big-schedule";
import dayjs from "dayjs";
import "react-big-schedule/dist/css/style.css";

interface CalendarViewState {
  schedulerData: SchedulerData;
}

class CalendarView extends React.Component<{}, CalendarViewState> {
  constructor(props: any) {
    super(props);

    // Initialize SchedulerData with today's date and week view
    const schedulerData = new SchedulerData(dayjs().format(DATE_FORMAT), ViewType.Week);

    // Set locales
    schedulerData.setSchedulerLocale('pt-br');
    schedulerData.setCalendarPopoverLocale('pt_BR');

    // Set an empty events array
    schedulerData.setEvents([]);

    this.state = {
      schedulerData,
    };
  }

  render() {
    return (
      <Scheduler
        schedulerData={this.state.schedulerData}
      />
    );
  }
}

export default CalendarView;
